import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Play, Zap, Heart, Star, Timer, ChevronRight, RotateCcw } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D, ProgressBar, Badge } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import { initializeHandTracking, stopHandTracking, drawLandmarks } from '@/services/handTracking'
import { normalizeLandmarks } from '@/utils/normalizeLandmarks'
import { compareSigns } from '@/utils/compareSigns'
import { getRecordedSign, preloadRecordedSigns } from '@/services/signStorage'
import { UNITS } from '@/data/signDatabase'
import useLanguage from '@/stores/useLanguage'
import useAuth from '@/hooks/useAuth'
import useProgress from '@/hooks/useProgress'
import useCombo, { comboMultiplier } from '@/stores/useCombo'
import ComboDisplay from '@/components/common/ComboDisplay'

const PHASE = {
  INTRO: 'intro',
  COUNTDOWN: 'countdown',
  PLAY: 'play',
  RESULT: 'result',
  NO_HEARTS: 'no_hearts',
}

const SUCCESS_THRESHOLD = 75   // PDF: ±15% lenient (80 → 75)
const BASE_XP = 25

function pickRandomSign() {
  const fingerspellingUnit = UNITS.find((u) => u.id === 'fingerspelling')
  if (!fingerspellingUnit) return null
  const signs = fingerspellingUnit.signs
  // Prefer signs with recorded reference data; fall back to all
  const withRefs = signs.filter((s) => getRecordedSign(s.id))
  const pool = withRefs.length > 0 ? withRefs : signs
  return pool[Math.floor(Math.random() * pool.length)]
}

function timeLimitForSign(sign) {
  // Dynamic signs (diphthongs, ssang-consonants) get +2s
  return sign.type === 'dynamic' ? 12 : 10
}

export default function FingerspellingChallenge() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const { row: progress, addXp, addStars, useHeart } = useProgress()
  const comboCount = useCombo((s) => s.combo)
  const comboIncrement = useCombo((s) => s.increment)
  const comboBreak = useCombo((s) => s.break)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const latestResultsRef = useRef({ hands: null })
  const maxScoreRef = useRef(0)
  const intervalRef = useRef(null)
  const countdownRef = useRef(null)

  const [phase, setPhase] = useState(PHASE.INTRO)
  const [countdown, setCountdown] = useState(3)
  const [currentSign, setCurrentSign] = useState(null)
  const [timeLeft, setTimeLeft] = useState(10)
  const [timeLimit, setTimeLimit] = useState(10)
  const [liveScore, setLiveScore] = useState(0)
  const [resultData, setResultData] = useState(null) // { final, accuracy, timeBonus, xpGranted, stars, success }
  const [tracking, setTracking] = useState(false)

  // Preload Supabase recordings once
  useEffect(() => {
    preloadRecordedSigns()
  }, [])

  // Init MediaPipe
  useEffect(() => {
    if (!videoRef.current) return
    let cancelled = false
    const handle = (combined) => {
      latestResultsRef.current = combined
      if (canvasRef.current) drawLandmarks(canvasRef.current, combined)
    }
    initializeHandTracking(videoRef.current, handle).then(() => {
      if (!cancelled) setTracking(true)
    })
    return () => {
      cancelled = true
      stopHandTracking()
      setTracking(false)
    }
  }, [])

  // Main play loop: each tick, decrement time + sample current similarity
  useEffect(() => {
    if (phase !== PHASE.PLAY || !currentSign) return
    maxScoreRef.current = 0
    setLiveScore(0)
    const startedAt = Date.now()

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remaining = Math.max(0, timeLimit - elapsed)
      setTimeLeft(remaining)

      // Compare current frame to reference landmarks
      const hands = latestResultsRef.current?.hands
      if (hands?.multiHandLandmarks?.length > 0) {
        const userNormalized = normalizeLandmarks(
          hands.multiHandLandmarks[0].map((p) => ({ x: p.x, y: p.y, z: p.z }))
        )
        if (userNormalized) {
          const recorded = getRecordedSign(currentSign.id)
          const refLandmarks = recorded?.landmarks || currentSign.landmarks
          if (refLandmarks) {
            const score = compareSigns(userNormalized, refLandmarks)
            maxScoreRef.current = Math.max(maxScoreRef.current, score)
            setLiveScore(score)

            // Instant success — hit threshold mid-challenge
            if (score >= SUCCESS_THRESHOLD) {
              finish({ success: true, remaining })
              return
            }
          }
        }
      }

      if (remaining <= 0) {
        finish({ success: false, remaining: 0 })
      }
    }

    intervalRef.current = setInterval(tick, 100)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSign, timeLimit])

  const finish = async ({ success, remaining }) => {
    clearInterval(intervalRef.current)
    const accuracy = success ? Math.max(SUCCESS_THRESHOLD, maxScoreRef.current) : maxScoreRef.current
    const timeRatio = remaining / timeLimit
    // PDF: accuracy * 0.7 + timeRatio * 100 * 0.3
    const finalScore = Math.round(accuracy * 0.7 + timeRatio * 100 * 0.3)

    let xpGranted = 0
    let starGranted = 0
    if (success) {
      comboIncrement()
      const multiplier = comboMultiplier(comboCount + 1)
      const xpReward = Math.round(BASE_XP * multiplier)
      starGranted = Math.round(timeRatio * 10)
      try {
        const { granted } = await addXp(xpReward)
        xpGranted = granted ?? xpReward
        if (starGranted > 0) await addStars(starGranted)
      } catch (e) {
        console.warn('[Challenge] reward failed:', e.message)
      }
    } else {
      comboBreak()
      try {
        await useHeart()
      } catch (e) {
        console.warn('[Challenge] heart consume failed:', e.message)
      }
    }

    setResultData({
      success,
      finalScore,
      accuracy: Math.round(accuracy),
      timeBonus: Math.round(timeRatio * 100 * 0.3),
      xpGranted,
      stars: starGranted,
    })
    setPhase(PHASE.RESULT)
  }

  const start = () => {
    // Heart gate — block start if no hearts
    if (user && (progress?.hearts ?? 5) <= 0) {
      setPhase(PHASE.NO_HEARTS)
      return
    }

    const sign = pickRandomSign()
    if (!sign) {
      console.warn('[Challenge] no fingerspelling signs available')
      return
    }
    const limit = timeLimitForSign(sign)
    setCurrentSign(sign)
    setTimeLimit(limit)
    setTimeLeft(limit)
    setResultData(null)
    setPhase(PHASE.COUNTDOWN)
    setCountdown(3)
    let c = 3
    countdownRef.current = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) {
        clearInterval(countdownRef.current)
        setPhase(PHASE.PLAY)
      }
    }, 1000)
  }

  // Cleanup
  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearInterval(countdownRef.current)
  }, [])

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-[fadeIn_0.5s_ease]">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/missions')} className="cursor-pointer hover:scale-110 transition-transform">
          <ArrowLeft size={22} strokeWidth={2.5} color={COLORS.gray400} />
        </button>
        <div className="flex items-center gap-2">
          <Zap size={18} color={COLORS.orange} fill={COLORS.orange} strokeWidth={2.5} />
          <h1 className="text-lg font-black" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '지문자 10초 챌린지' : 'Fingerspelling 10s Challenge'}
          </h1>
        </div>
      </div>

      {phase === PHASE.INTRO && (
        <IntroScreen lang={lang} onStart={start} tracking={tracking} progress={progress} />
      )}

      {phase === PHASE.NO_HEARTS && (
        <NoHeartsScreen lang={lang} onBack={() => navigate('/missions')} />
      )}

      {(phase === PHASE.COUNTDOWN || phase === PHASE.PLAY || phase === PHASE.RESULT) && (
        <Card3D color={COLORS.gray200} padding="p-5">
          {/* Hidden during INTRO/NO_HEARTS, but keep mounted to avoid re-init */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Target sign + timer */}
            <div className="flex flex-col">
              <div className="text-center pb-3">
                <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: COLORS.gray400 }}>
                  {lang === 'ko' ? '이 자모를 만들어보세요' : 'Make this sign'}
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center rounded-2xl py-8"
                style={{ background: `${COLORS.purple}10`, border: `2px solid ${COLORS.purple}30` }}>
                <span className="font-black" style={{ fontSize: '7rem', lineHeight: 1, color: COLORS.purple }}>
                  {currentSign?.name_ko ?? '?'}
                </span>
              </div>

              {currentSign && (
                <p className="text-center text-xs font-bold mt-2" style={{ color: COLORS.gray500 }}>
                  {currentSign.name_en} · {currentSign.tips_ko || currentSign.tips}
                </p>
              )}

              {/* Timer */}
              {phase === PHASE.PLAY && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span style={{ color: COLORS.gray500 }}>
                      <Timer size={12} className="inline mr-1" />
                      {lang === 'ko' ? '남은 시간' : 'Time left'}
                    </span>
                    <span style={{ color: timeLeft <= 3 ? COLORS.red : COLORS.gray700 }}>
                      {timeLeft.toFixed(1)}s
                    </span>
                  </div>
                  <ProgressBar
                    progress={(timeLeft / timeLimit) * 100}
                    color={timeLeft <= 3 ? COLORS.red : timeLeft <= 5 ? COLORS.orange : COLORS.green}
                    height="h-2"
                  />
                </div>
              )}

              {/* Live similarity bar */}
              {phase === PHASE.PLAY && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span style={{ color: COLORS.gray500 }}>{lang === 'ko' ? '현재 일치도' : 'Match'}</span>
                    <span style={{ color: liveScore >= SUCCESS_THRESHOLD ? COLORS.green : COLORS.gray700 }}>
                      {Math.round(liveScore)}%
                    </span>
                  </div>
                  <ProgressBar
                    progress={liveScore}
                    color={liveScore >= SUCCESS_THRESHOLD ? COLORS.green : liveScore >= 50 ? COLORS.yellow : COLORS.gray300}
                    height="h-2"
                  />
                </div>
              )}
            </div>

            {/* Webcam */}
            <div className="relative">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{ border: `3px solid ${phase === PHASE.PLAY ? COLORS.red : COLORS.gray300}` }}
              >
                <video ref={videoRef} className="w-full" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"
                  width={640} height={480} style={{ transform: 'scaleX(-1)' }} />

                {phase === PHASE.COUNTDOWN && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-8xl font-black text-white animate-ping">{countdown}</div>
                  </div>
                )}

                <ComboDisplay position="top-right" />
              </div>
            </div>
          </div>

          {/* Result panel */}
          {phase === PHASE.RESULT && resultData && (
            <ResultPanel
              lang={lang}
              data={resultData}
              onRetry={start}
              onExit={() => navigate('/missions')}
            />
          )}
        </Card3D>
      )}

      {/* Always-mounted hidden video for INTRO / NO_HEARTS phases — keeps MediaPipe initialized */}
      {(phase === PHASE.INTRO || phase === PHASE.NO_HEARTS) && (
        <div className="hidden">
          <video ref={videoRef} autoPlay playsInline muted />
          <canvas ref={canvasRef} width={640} height={480} />
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

function IntroScreen({ lang, onStart, tracking, progress }) {
  const hearts = progress?.hearts ?? 5
  return (
    <Card3D color={COLORS.orange} padding="p-6">
      <div className="flex items-center gap-4">
        <HandMascot size={64} mood="excited" />
        <div className="flex-1">
          <h2 className="text-xl font-black" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '준비됐나요?' : 'Ready?'}
          </h2>
          <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray500 }}>
            {lang === 'ko'
              ? '랜덤 자모 1개를 10초 안에 손으로 만들어 보세요.'
              : 'You have 10 seconds to fingerspell one random letter.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-5 text-center">
        <Stat label={lang === 'ko' ? '제한 시간' : 'Time'} value="10s" color={COLORS.green} />
        <Stat label={lang === 'ko' ? '기본 보상' : 'Base XP'} value={`+${BASE_XP}`} color={COLORS.yellow} />
        <Stat label={lang === 'ko' ? '내 하트' : 'Your hearts'} value={`${hearts}/5`} color={COLORS.red} />
      </div>

      <ul className="mt-5 space-y-1.5 text-xs font-bold" style={{ color: COLORS.gray600 }}>
        <li>• {lang === 'ko' ? '일치도 75% 이상 도달 시 즉시 성공' : 'Hit 75% match for instant success'}</li>
        <li>• {lang === 'ko' ? '잔여 시간 비율 × 10 만큼 스타 보너스' : 'Time bonus: up to +10 stars based on remaining time'}</li>
        <li>• {lang === 'ko' ? '실패 시 하트 1개 차감' : 'Fail: -1 heart'}</li>
      </ul>

      <div className="mt-5">
        <Button3D fullWidth size="lg" color={COLORS.orange} darkColor={COLORS.orangeDark}
          icon={<Play size={18} />} onClick={onStart} disabled={!tracking}>
          {tracking
            ? (lang === 'ko' ? '시작!' : 'Start!')
            : (lang === 'ko' ? '카메라 준비 중...' : 'Loading camera...')}
        </Button3D>
      </div>
    </Card3D>
  )
}

function NoHeartsScreen({ lang, onBack }) {
  return (
    <Card3D color={COLORS.red} padding="p-6" className="text-center">
      <Heart size={48} color={COLORS.red} className="mx-auto" />
      <h2 className="text-xl font-black mt-3" style={{ color: COLORS.gray800 }}>
        {lang === 'ko' ? '하트가 모두 소진됐어요' : 'Out of hearts'}
      </h2>
      <p className="text-sm font-semibold mt-2" style={{ color: COLORS.gray500 }}>
        {lang === 'ko'
          ? '20분마다 하트가 1개씩 회복됩니다. 그동안은 일반 레슨에서 안전하게 연습할 수 있어요.'
          : 'Hearts refill 1 per 20 minutes. Practice safely in regular lessons meanwhile.'}
      </p>
      <div className="mt-5 flex gap-2 justify-center">
        <ButtonOutline color={COLORS.gray400} onClick={onBack}>
          {lang === 'ko' ? '돌아가기' : 'Go back'}
        </ButtonOutline>
      </div>
    </Card3D>
  )
}

function ResultPanel({ lang, data, onRetry, onExit }) {
  const { success, finalScore, accuracy, timeBonus, xpGranted, stars } = data
  return (
    <div className="mt-5 rounded-2xl p-5 animate-[fadeIn_0.4s_ease]"
      style={{ background: success ? `${COLORS.green}10` : `${COLORS.gray100}`, border: `2px solid ${success ? COLORS.green : COLORS.gray300}` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider"
            style={{ color: success ? COLORS.green : COLORS.gray500 }}>
            {success
              ? (lang === 'ko' ? '🎉 성공!' : '🎉 Success!')
              : (lang === 'ko' ? '⏱ 시간 종료' : '⏱ Time’s up')}
          </p>
          <p className="text-4xl font-black mt-1" style={{ color: success ? COLORS.green : COLORS.gray700 }}>
            {finalScore}
            <span className="text-sm font-bold ml-1" style={{ color: COLORS.gray400 }}>/100</span>
          </p>
        </div>
        <div className="text-right text-xs space-y-1" style={{ color: COLORS.gray600 }}>
          <p>{lang === 'ko' ? '정확도' : 'Accuracy'}: <span className="font-black">{accuracy}%</span> × 0.7</p>
          <p>{lang === 'ko' ? '시간 보너스' : 'Time bonus'}: <span className="font-black">{timeBonus}</span> × 0.3</p>
        </div>
      </div>

      {success && (
        <div className="mt-4 flex items-center gap-3">
          <Badge color={COLORS.yellow}>+{xpGranted} XP</Badge>
          {stars > 0 && <Badge color={COLORS.yellow}>+{stars} ★</Badge>}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <ButtonOutline color={COLORS.gray400} icon={<X size={14} />} onClick={onExit}>
          {lang === 'ko' ? '종료' : 'Exit'}
        </ButtonOutline>
        <Button3D
          className="flex-1"
          color={COLORS.orange}
          darkColor={COLORS.orangeDark}
          icon={success ? <ChevronRight size={16} /> : <RotateCcw size={16} />}
          onClick={onRetry}
        >
          {success
            ? (lang === 'ko' ? '한 번 더!' : 'One more!')
            : (lang === 'ko' ? '다시 시도' : 'Try again')}
        </Button3D>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl py-2 px-2" style={{ background: `${color}15`, border: `2px solid ${color}30` }}>
      <p className="text-xl font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold mt-0.5" style={{ color: COLORS.gray500 }}>{label}</p>
    </div>
  )
}
