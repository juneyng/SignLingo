import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Play, Zap, Timer, ChevronRight, RotateCcw } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D, ProgressBar, Badge } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import { initializeHandTracking, stopHandTracking, drawLandmarks } from '@/services/handTracking'
import { normalizeLandmarks } from '@/utils/normalizeLandmarks'
import { compareSigns } from '@/utils/compareSigns'
import { getRecordedSign, preloadRecordedSigns } from '@/services/signStorage'
import { UNITS } from '@/data/signDatabase'
import useLanguage from '@/stores/useLanguage'
import useProgress from '@/hooks/useProgress'
import useCombo, { comboMultiplier } from '@/stores/useCombo'
import ComboDisplay from '@/components/common/ComboDisplay'

const PHASE = {
  INTRO: 'intro',
  COUNTDOWN: 'countdown',
  PLAY: 'play',
  RESULT: 'result',
}

const SUCCESS_THRESHOLD = 75   // PDF: ±15% lenient (80 → 75)
const BASE_XP = 25

function pickRandomSign() {
  const fingerspellingUnit = UNITS.find((u) => u.id === 'fingerspelling')
  if (!fingerspellingUnit) return null
  const signs = fingerspellingUnit.signs
  const withRefs = signs.filter((s) => getRecordedSign(s.id))
  const pool = withRefs.length > 0 ? withRefs : signs
  return pool[Math.floor(Math.random() * pool.length)]
}

function timeLimitForSign(sign) {
  return sign.type === 'dynamic' ? 12 : 10
}

export default function FingerspellingChallenge() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { addXp, addStars, bumpMission } = useProgress()
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
  const [resultData, setResultData] = useState(null)
  const [tracking, setTracking] = useState(false)

  useEffect(() => { preloadRecordedSigns() }, [])

  // Init MediaPipe ONCE — the video element below stays mounted for the
  // entire lifetime of the component (re-parented across phases).
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

  // Play loop
  useEffect(() => {
    if (phase !== PHASE.PLAY || !currentSign) return
    maxScoreRef.current = 0
    setLiveScore(0)
    const startedAt = Date.now()

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000
      const remaining = Math.max(0, timeLimit - elapsed)
      setTimeLeft(remaining)

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
            if (score >= SUCCESS_THRESHOLD) {
              finish({ success: true, remaining })
              return
            }
          }
        }
      }
      if (remaining <= 0) finish({ success: false, remaining: 0 })
    }

    intervalRef.current = setInterval(tick, 100)
    return () => clearInterval(intervalRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSign, timeLimit])

  const finish = async ({ success, remaining }) => {
    clearInterval(intervalRef.current)
    const accuracy = success ? Math.max(SUCCESS_THRESHOLD, maxScoreRef.current) : maxScoreRef.current
    const timeRatio = remaining / timeLimit
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
    }

    try { await bumpMission('challenge_done') } catch (e) { /* ignore */ }

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
    const sign = pickRandomSign()
    if (!sign) return
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

  const exitToIntro = () => {
    clearInterval(intervalRef.current)
    clearInterval(countdownRef.current)
    setPhase(PHASE.INTRO)
    setCurrentSign(null)
    setResultData(null)
  }

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearInterval(countdownRef.current)
  }, [])

  const inModal = phase === PHASE.COUNTDOWN || phase === PHASE.PLAY || phase === PHASE.RESULT

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-[fadeIn_0.5s_ease]">
      {/* Top bar (only when not in modal) */}
      {!inModal && (
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
      )}

      {phase === PHASE.INTRO && (
        <IntroScreen lang={lang} onStart={start} tracking={tracking} />
      )}

      {/*
        Webcam modal container.
        - inModal=true:  full-screen modal overlay
        - inModal=false: parked off-screen at 1×1 px so MediaPipe keeps streaming
        The <video> element below NEVER unmounts.
      */}
      <div
        className={inModal
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 animate-[fadeIn_0.25s_ease]'
          : 'fixed pointer-events-none opacity-0 overflow-hidden'}
        style={!inModal ? { left: -9999, top: -9999, width: 1, height: 1 } : undefined}
        aria-hidden={!inModal}
      >
        {inModal && (
          <button
            onClick={exitToIntro}
            className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-10"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}
          >
            <X size={20} color="white" strokeWidth={3} />
          </button>
        )}

        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-5">
          {/* Target sign panel */}
          <div className="rounded-3xl p-5 flex flex-col"
            style={{ background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.12)' }}>
            <p className="text-xs font-extrabold uppercase tracking-wider text-center mb-3"
              style={{ color: 'rgba(255,255,255,0.7)' }}>
              {lang === 'ko' ? '이 자모를 만들어보세요' : 'Make this sign'}
            </p>

            <div className="flex-1 flex items-center justify-center rounded-2xl py-6 mb-3"
              style={{ background: `${COLORS.purple}30`, border: `2px solid ${COLORS.purple}` }}>
              <span className="font-black"
                style={{ fontSize: 'min(40vh, 14rem)', lineHeight: 1, color: 'white' }}>
                {currentSign?.name_ko ?? '?'}
              </span>
            </div>

            {currentSign && (
              <p className="text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {currentSign.name_en} · {lang === 'ko' ? (currentSign.tips_ko || currentSign.tips) : (currentSign.tips || currentSign.tips_ko)}
              </p>
            )}

            {phase === PHASE.PLAY && (
              <>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      <Timer size={12} className="inline mr-1" />
                      {lang === 'ko' ? '남은 시간' : 'Time'}
                    </span>
                    <span style={{ color: timeLeft <= 3 ? COLORS.red : 'white' }}>
                      {timeLeft.toFixed(1)}s
                    </span>
                  </div>
                  <ProgressBar
                    progress={(timeLeft / timeLimit) * 100}
                    color={timeLeft <= 3 ? COLORS.red : timeLeft <= 5 ? COLORS.orange : COLORS.green}
                    height="h-2"
                  />
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs font-extrabold mb-1">
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {lang === 'ko' ? '현재 일치도' : 'Match'}
                    </span>
                    <span style={{ color: liveScore >= SUCCESS_THRESHOLD ? COLORS.green : 'white' }}>
                      {Math.round(liveScore)}%
                    </span>
                  </div>
                  <ProgressBar
                    progress={liveScore}
                    color={liveScore >= SUCCESS_THRESHOLD ? COLORS.green : liveScore >= 50 ? COLORS.yellow : COLORS.gray300}
                    height="h-2"
                  />
                </div>
              </>
            )}
          </div>

          {/* Webcam panel */}
          <div className="relative rounded-3xl overflow-hidden"
            style={{
              border: `3px solid ${phase === PHASE.PLAY ? COLORS.red : 'rgba(255,255,255,0.25)'}`,
              boxShadow: phase === PHASE.PLAY ? `0 0 40px ${COLORS.red}80` : undefined,
            }}>
            <video ref={videoRef} className="w-full" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"
              width={640} height={480} style={{ transform: 'scaleX(-1)' }} />

            {phase === PHASE.COUNTDOWN && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-9xl font-black text-white animate-ping">{countdown}</div>
              </div>
            )}

            <ComboDisplay position="top-right" />

            {phase === PHASE.RESULT && resultData && (
              <ResultOverlay
                lang={lang}
                data={resultData}
                onRetry={start}
                onExit={exitToIntro}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </div>
  )
}

function IntroScreen({ lang, onStart, tracking }) {
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

      <div className="grid grid-cols-2 gap-3 mt-5 text-center">
        <Stat label={lang === 'ko' ? '제한 시간' : 'Time'} value="10s" color={COLORS.green} />
        <Stat label={lang === 'ko' ? '기본 보상' : 'Base XP'} value={`+${BASE_XP}`} color={COLORS.yellow} />
      </div>

      <ul className="mt-5 space-y-1.5 text-xs font-bold" style={{ color: COLORS.gray600 }}>
        <li>• {lang === 'ko' ? '일치도 75% 이상 도달 시 즉시 성공' : 'Hit 75% match for instant success'}</li>
        <li>• {lang === 'ko' ? '잔여 시간 비율 × 10 만큼 스타 보너스' : 'Time bonus: up to +10 stars based on remaining time'}</li>
        <li>• {lang === 'ko' ? '성공 시 +25 XP × 콤보 배율' : 'Success: +25 XP × combo multiplier'}</li>
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

function ResultOverlay({ lang, data, onRetry, onExit }) {
  const { success, finalScore, accuracy, timeBonus, xpGranted, stars } = data
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 animate-[fadeIn_0.3s_ease]"
      style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-3xl p-6 max-w-sm w-full text-center"
        style={{
          background: 'white',
          borderBottom: `4px solid ${success ? COLORS.green : COLORS.gray400}`,
        }}>
        <p className="text-xs font-extrabold uppercase tracking-wider"
          style={{ color: success ? COLORS.green : COLORS.gray500 }}>
          {success
            ? (lang === 'ko' ? '🎉 성공!' : '🎉 Success!')
            : (lang === 'ko' ? '⏱ 시간 종료' : '⏱ Time’s up')}
        </p>
        <p className="text-5xl font-black mt-2" style={{ color: success ? COLORS.green : COLORS.gray700 }}>
          {finalScore}
          <span className="text-base font-bold ml-1" style={{ color: COLORS.gray400 }}>/100</span>
        </p>
        <div className="text-xs space-y-0.5 mt-3" style={{ color: COLORS.gray600 }}>
          <p>{lang === 'ko' ? '정확도' : 'Accuracy'} {accuracy}% × 0.7</p>
          <p>{lang === 'ko' ? '시간 보너스' : 'Time bonus'} {timeBonus} × 0.3</p>
        </div>
        {success && (
          <div className="mt-3 flex items-center justify-center gap-2">
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
