import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, X, Check, Play, ChevronRight, ExternalLink, RotateCcw, Eye, Video, AlertCircle } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D, ProgressBar, FeedbackCard, Badge } from '@/design-system/components'
import { AccuracyGauge, HandMascot } from '@/design-system/icons'
import { initializeHandTracking, stopHandTracking, drawLandmarks } from '@/services/handTracking'
import { normalizeLandmarks, normalizePoseLandmarks } from '@/utils/normalizeLandmarks'
import { compareRecordedSign, findDifferingLandmarks } from '@/utils/compareSigns'
import { generateFeedback, generatePoseFeedback } from '@/utils/feedbackGenerator'
import { getUnit } from '@/data/signDatabase'
import { getSignVideo, getRecordedSign } from '@/services/signStorage'
import useLanguage from '@/stores/useLanguage'

const RECORD_DURATION = 6 // seconds

// Phases: WATCH → COUNTDOWN → RECORDING → ANALYZING → RESULT
const PHASE = { WATCH: 'watch', COUNTDOWN: 'countdown', RECORDING: 'recording', ANALYZING: 'analyzing', RESULT: 'result' }

export default function LessonPlay() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const refVideoRef = useRef(null)

  const unit = getUnit(lessonId)
  const signs = unit.signs

  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState(PHASE.WATCH)
  const [countdown, setCountdown] = useState(3)
  const [recordProgress, setRecordProgress] = useState(0)
  const [score, setScore] = useState(0)
  const [handScore, setHandScore] = useState(0)
  const [poseScore, setPoseScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [feedbackType, setFeedbackType] = useState('hint')
  const [isTracking, setIsTracking] = useState(false)
  const [completedSigns, setCompletedSigns] = useState(new Set())
  const [showComplete, setShowComplete] = useState(false)
  const [hasRealData, setHasRealData] = useState(false)
  const [localVideoUrl, setLocalVideoUrl] = useState(null)

  // Recording buffer
  const framesRef = useRef([])
  const recordTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)

  const currentSign = signs[currentIndex]
  const usesPose = !!currentSign.poseLandmarks

  // Pause reference video during recording/analysis to free up resources
  useEffect(() => {
    const v = refVideoRef.current
    if (!v) return
    if (phase === PHASE.WATCH || phase === PHASE.RESULT) {
      v.play().catch(() => {})
    } else {
      v.pause()
    }
  }, [phase])

  // Load saved reference video (Supabase URL or IndexedDB blob URL) when sign changes
  useEffect(() => {
    getSignVideo(currentSign.id)
      .then((urlOrNull) => setLocalVideoUrl(urlOrNull))
      .catch(() => setLocalVideoUrl(null))
  }, [currentSign.id])
  const unitTitle = lang === 'ko' ? unit.titleKo : unit.titleEn
  const desc = lang === 'ko' ? (currentSign.description_ko || currentSign.description) : currentSign.description
  const tips = lang === 'ko' ? (currentSign.tips_ko || currentSign.tips) : currentSign.tips

  // Latest combined results ref (always updated by MediaPipe)
  const latestResultsRef = useRef({ hands: null, pose: null })

  // Init MediaPipe once
  useEffect(() => {
    if (!videoRef.current) return
    let cancelled = false

    const handleResults = (combinedResults) => {
      latestResultsRef.current = combinedResults
      if (canvasRef.current) drawLandmarks(canvasRef.current, combinedResults)
    }

    initializeHandTracking(videoRef.current, handleResults).then(() => {
      if (!cancelled) setIsTracking(true)
    })
    return () => { cancelled = true; stopHandTracking(); setIsTracking(false) }
  }, [])

  // Collect frames during RECORDING phase
  useEffect(() => {
    if (phase !== PHASE.RECORDING) return

    framesRef.current = []
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setRecordProgress(Math.min(elapsed / RECORD_DURATION, 1))

      // Capture current frame's landmarks
      const { hands, pose } = latestResultsRef.current
      let handData = null
      if (hands?.multiHandLandmarks?.length > 0) {
        const raw = hands.multiHandLandmarks[0]
        handData = normalizeLandmarks(raw.map(p => ({ x: p.x, y: p.y, z: p.z })))
      }
      let poseData = null
      if (pose?.poseLandmarks) {
        poseData = normalizePoseLandmarks(pose.poseLandmarks)
      }
      if (handData) {
        // Build flat feature vector: hand(63) + pose(21) = 84
        const handFlat = handData.flat()
        const poseFlat = poseData ? poseData.armLandmarks.flat() : Array(21).fill(0)
        framesRef.current.push({
          features: [...handFlat, ...poseFlat],
          hand: handData,
          pose: poseData,
          t: elapsed,
        })
      }

      if (elapsed >= RECORD_DURATION) {
        clearInterval(interval)
        setPhase(PHASE.ANALYZING)
      }
    }, 100) // 10 fps capture

    recordTimerRef.current = interval
    return () => clearInterval(interval)
  }, [phase])

  // Analyze after recording
  useEffect(() => {
    if (phase !== PHASE.ANALYZING) return

    const frames = framesRef.current
    if (frames.length < 3) {
      setScore(0); setHandScore(0); setPoseScore(0)
      setFeedback(lang === 'ko' ? '손이 감지되지 않았어요. 카메라에 손이 보이게 다시 시도해주세요.' : 'No hand detected. Make sure your hand is visible and try again.')
      setFeedbackType('error')
      setPhase(PHASE.RESULT)
      return
    }

    // Build user sequence (array of feature vectors)
    const userSequence = frames.map(f => f.features)

    console.log('[LessonPlay] Analyzing:', {
      signId: currentSign.id,
      userFrames: userSequence.length,
      userFeatureLen: userSequence[0]?.length,
      hasLocalRef: !!getRecordedSign(currentSign.id),
      hasDbSequence: !!(currentSign.sequence?.length),
    })

    // Use the new DTW-based comparison
    const result = compareRecordedSign(userSequence, currentSign)

    console.log('[LessonPlay] Result:', result)

    setScore(result.score)
    setHandScore(result.handScore)
    setPoseScore(result.poseScore)
    setHasRealData(result.hasSequence)

    if (result.score >= 80) {
      setFeedback(lang === 'ko' ? '훌륭해요! 수어가 정확합니다!' : 'Excellent! Sign is correct!')
      setFeedbackType('success')
      setCompletedSigns(prev => new Set(prev).add(currentIndex))
    } else if (!result.hasSequence) {
      // No real reference data — warn user
      setFeedback(lang === 'ko'
        ? '⚠️ 이 수어는 아직 참조 데이터가 녹화되지 않았어요. /record 페이지에서 먼저 녹화해주세요.'
        : '⚠️ No recorded reference data for this sign yet. Please record it first at /record.')
      setFeedbackType('hint')
    } else {
      // Real comparison — give specific feedback
      const midFrame = frames[Math.floor(frames.length / 2)]
      const msgs = []
      if (midFrame.hand && result.handScore < 80) {
        msgs.push(generateFeedback(
          findDifferingLandmarks(midFrame.hand, currentSign.landmarks), lang
        ))
      }
      if (midFrame.pose && usesPose && result.poseScore < 80 && currentSign.refHandPosition) {
        const fb = generatePoseFeedback(midFrame.pose.handPosition, currentSign.refHandPosition, lang)
        if (fb) msgs.push(fb)
      }
      setFeedback(msgs.join(' ') || (lang === 'ko' ? '영상을 보고 다시 시도해보세요.' : 'Watch the reference and try again.'))
      setFeedbackType(result.score >= 50 ? 'hint' : 'error')
    }

    setPhase(PHASE.RESULT)
  }, [phase, currentSign, currentIndex, lang, usesPose])

  // Countdown logic
  const startCountdown = () => {
    setPhase(PHASE.COUNTDOWN)
    setCountdown(3)
    let count = 3
    countdownTimerRef.current = setInterval(() => {
      count--
      setCountdown(count)
      if (count <= 0) {
        clearInterval(countdownTimerRef.current)
        setPhase(PHASE.RECORDING)
        setRecordProgress(0)
      }
    }, 1000)
  }

  // Cleanup timers
  useEffect(() => {
    return () => {
      clearInterval(recordTimerRef.current)
      clearInterval(countdownTimerRef.current)
    }
  }, [])

  const goToSign = (i) => {
    setCurrentIndex(i); setPhase(PHASE.WATCH); setScore(0); setHandScore(0); setPoseScore(0)
    setFeedback(''); setFeedbackType('hint'); setRecordProgress(0)
  }
  const nextSign = () => {
    currentIndex < signs.length - 1 ? goToSign(currentIndex + 1) : setShowComplete(true)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-[fadeIn_0.5s_ease]">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/lessons')} className="cursor-pointer hover:scale-110 transition-transform">
          <ArrowLeft size={24} strokeWidth={2.5} color={COLORS.gray400} />
        </button>
        <span className="text-sm font-extrabold" style={{ color: COLORS.gray600 }}>{unitTitle}</span>
        <div className="flex-1 mx-3">
          <ProgressBar progress={((currentIndex + 1) / signs.length) * 100} color={COLORS.green} height="h-3" />
        </div>
        <span className="text-xs font-bold" style={{ color: COLORS.gray400 }}>{currentIndex + 1}/{signs.length}</span>
        <button onClick={() => navigate('/lessons')} className="cursor-pointer hover:scale-110 transition-transform ml-1">
          <X size={22} strokeWidth={2.5} color={COLORS.gray400} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT — Reference */}
        <Card3D color={COLORS.gray200} padding="p-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: COLORS.gray400 }}>{t.reference}</h2>
            {usesPose && <Badge color={COLORS.blue}>{lang === 'ko' ? '팔 동작' : 'Arms'}</Badge>}
            {currentSign.type === 'dynamic' && <Badge color={COLORS.purple}>{lang === 'ko' ? '동적' : 'Dynamic'}</Badge>}
          </div>

          {/* Reference video from Supabase */}
          {localVideoUrl ? (
            <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `2px solid ${localVideoUrl ? COLORS.green : COLORS.gray200}` }}>
              <video
                ref={refVideoRef}
                key={currentSign.id + (localVideoUrl ? '_local' : '_remote')}
                src={localVideoUrl}
                className="w-full"
                controls
                autoPlay
                loop
                muted
                playsInline
                style={{ background: COLORS.gray50 }}
              />
              {localVideoUrl && (
                <div className="px-3 py-1 text-center" style={{ background: COLORS.greenLight }}>
                  <span className="text-[10px] font-bold" style={{ color: COLORS.greenDark }}>
                    {lang === 'ko' ? '등록된 참고 영상' : 'Registered reference video'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: COLORS.orangeBg, border: `2px dashed ${COLORS.orange}80` }}>
              <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                <AlertCircle size={32} color={COLORS.orange} strokeWidth={2.5} />
                <p className="text-4xl font-black mt-3" style={{ color: COLORS.gray800 }}>{currentSign.name_ko}</p>
                <p className="font-extrabold text-sm mt-3" style={{ color: COLORS.orangeDark }}>
                  {lang === 'ko' ? '참고 영상이 아직 등록되지 않았어요' : 'No reference video registered yet'}
                </p>
                <p className="text-xs font-bold mt-1" style={{ color: COLORS.gray600 }}>
                  {lang === 'ko'
                    ? '녹화 페이지에서 이 수어의 참고 영상을 등록해주세요.'
                    : 'Register a reference video for this sign on the Record page.'}
                </p>
                <button
                  onClick={() => navigate('/record')}
                  className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer hover:scale-105 transition-transform"
                  style={{ background: COLORS.orange, color: 'white', borderBottom: `3px solid ${COLORS.orangeDark}` }}
                >
                  <Video size={14} />
                  {lang === 'ko' ? '녹화 페이지로 이동' : 'Go to Record'}
                </button>
              </div>
            </div>
          )}

          <p className="font-black text-lg" style={{ color: COLORS.gray800 }}>{currentSign.name_en}</p>
          <p className="text-xs font-semibold mt-1" style={{ color: COLORS.gray500 }}>{desc}</p>

          {tips && (
            <div className="mt-3 rounded-xl p-3" style={{ background: COLORS.blueBg, border: `2px solid ${COLORS.blue}30` }}>
              <p className="text-xs font-extrabold mb-1" style={{ color: COLORS.blue }}>
                {lang === 'ko' ? '따라하기' : 'How to sign'}
              </p>
              <p className="text-xs font-bold" style={{ color: COLORS.gray700 }}>💡 {tips}</p>
            </div>
          )}
        </Card3D>

        {/* RIGHT — Practice */}
        <div className="space-y-4">
          <Card3D color={COLORS.gray200} padding="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-extrabold text-xs uppercase tracking-wide" style={{ color: COLORS.gray400 }}>{t.yourPractice}</h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: isTracking ? COLORS.greenBg : COLORS.yellowBg, color: isTracking ? COLORS.green : COLORS.orange }}>
                {isTracking ? t.tracking : t.loading}
              </span>
            </div>

            {/* Wrapper: full-screen flex centered when in modal mode */}
            <div
              className={
                (phase === PHASE.COUNTDOWN || phase === PHASE.RECORDING)
                  ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-[fadeIn_0.3s_ease]'
                  : 'contents'
              }
            >
            {/* Webcam with overlays */}
            <div
              className="relative rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                border: `3px ${phase === PHASE.RECORDING ? 'solid' : 'dashed'} ${phase === PHASE.RECORDING ? COLORS.red : COLORS.green}60`,
                ...((phase === PHASE.COUNTDOWN || phase === PHASE.RECORDING) ? {
                  width: '60vw',
                  maxWidth: '900px',
                } : {}),
              }}>
              <video ref={videoRef} className="w-full" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" width={640} height={480} style={{ transform: 'scaleX(-1)' }} />

              {/* Phase overlays */}
              {phase === PHASE.COUNTDOWN && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-8xl font-black text-white animate-ping">{countdown}</div>
                </div>
              )}

              {phase === PHASE.RECORDING && (
                <div className="absolute top-3 left-3 right-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: COLORS.red }} />
                    <span className="text-xs font-black text-white drop-shadow">
                      {lang === 'ko' ? '녹화 중...' : 'Recording...'}
                    </span>
                    <span className="text-xs font-bold text-white/70 ml-auto">
                      {Math.ceil(RECORD_DURATION - recordProgress * RECORD_DURATION)}s
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }}>
                    <div className="h-1.5 rounded-full transition-all duration-100"
                      style={{ width: `${recordProgress * 100}%`, background: COLORS.red }} />
                  </div>
                </div>
              )}

              {phase === PHASE.ANALYZING && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center text-white">
                    <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-bold mt-3">{lang === 'ko' ? '분석 중...' : 'Analyzing...'}</p>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Action button based on phase */}
            <div className="mt-4">
              {phase === PHASE.WATCH && (
                <Button3D fullWidth onClick={startCountdown}
                  color={COLORS.green} darkColor={COLORS.greenDark}
                  icon={<Play size={18} />} disabled={!isTracking}>
                  {lang === 'ko' ? '연습 시작' : 'Start Practice'}
                </Button3D>
              )}
              {(phase === PHASE.COUNTDOWN || phase === PHASE.RECORDING) && (
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: COLORS.gray500 }}>
                    {phase === PHASE.COUNTDOWN
                      ? (lang === 'ko' ? '준비하세요!' : 'Get ready!')
                      : (lang === 'ko' ? '수어를 해주세요!' : 'Perform the sign!')}
                  </p>
                </div>
              )}
            </div>
          </Card3D>

          {/* Result panel — only in RESULT phase */}
          {phase === PHASE.RESULT && (
            <div className="space-y-3 animate-[fadeIn_0.3s_ease]">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <AccuracyGauge score={score} size={100} />
                  {usesPose && (
                    <div className="flex gap-3 text-center">
                      <div>
                        <p className="text-xs font-black" style={{ color: COLORS.green }}>{handScore}%</p>
                        <p className="text-[10px] font-bold" style={{ color: COLORS.gray400 }}>{lang === 'ko' ? '손' : 'Hand'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-black" style={{ color: COLORS.blue }}>{poseScore}%</p>
                        <p className="text-[10px] font-bold" style={{ color: COLORS.gray400 }}>{lang === 'ko' ? '팔' : 'Arm'}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {!hasRealData && (
                    <div className="rounded-xl p-2 flex items-center gap-2"
                      style={{ background: COLORS.orangeBg, border: `2px solid ${COLORS.orange}30` }}>
                      <span className="text-xs font-bold" style={{ color: COLORS.orangeDark }}>
                        ⚠️ {lang === 'ko' ? '참조 데이터 미녹화 — 정확도가 낮을 수 있음' : 'No recorded reference — accuracy may be unreliable'}
                      </span>
                    </div>
                  )}
                  <FeedbackCard type={feedbackType} message={feedback} />
                  <div className="flex gap-2">
                    <ButtonOutline color={COLORS.gray400} size="sm"
                      icon={<RotateCcw size={14} />}
                      onClick={() => setPhase(PHASE.WATCH)}>
                      {t.tryAgain}
                    </ButtonOutline>
                    {score >= 80 && (
                      <Button3D size="sm" className="flex-1"
                        onClick={nextSign} icon={<ChevronRight size={14} />}>
                        {t.nextSign}
                      </Button3D>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom dots */}
      <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
        {signs.map((s, i) => {
          const done = completedSigns.has(i)
          const current = i === currentIndex
          return (
            <button key={s.id} onClick={() => goToSign(i)}
              className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${current && !done ? 'animate-pulse' : ''}`}
              style={{ background: done ? COLORS.green : current ? COLORS.blue : COLORS.gray200,
                borderBottom: `2px solid ${done ? COLORS.greenDark : current ? COLORS.blueDark : COLORS.gray300}`,
                color: done || current ? 'white' : COLORS.gray400 }}>
              {done ? <Check size={12} strokeWidth={3} /> : <span className="text-[8px] font-black">{i + 1}</span>}
            </button>
          )
        })}
      </div>

      {showComplete && (
        <LessonCompleteOverlay t={t} lang={lang} unit={unit}
          onNext={() => navigate('/lessons')}
          onReview={() => { setShowComplete(false); goToSign(0) }}
        />
      )}
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

function LessonCompleteOverlay({ t, lang, unit, onNext, onReview }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-[fadeIn_0.3s_ease]">
      <Card3D color={COLORS.green} padding="p-8" className="max-w-md w-full mx-4 text-center relative z-10">
        <div className="flex justify-center" style={{ animation: 'bounce 2s infinite' }}>
          <HandMascot size={80} mood="excited" />
        </div>
        <h2 className="text-2xl font-black mt-4" style={{ color: COLORS.gray800 }}>{t.lessonComplete}</h2>
        <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray500 }}>
          {lang === 'ko' ? unit.titleKo : unit.titleEn}
        </p>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-3 rounded-2xl" style={{ background: COLORS.blueBg }}>
            <p className="text-xl font-black" style={{ color: COLORS.blue }}>{unit.signs.length}</p>
            <p className="text-[10px] font-bold" style={{ color: COLORS.gray600 }}>{t.signs}</p>
          </div>
          <div className="p-3 rounded-2xl" style={{ background: COLORS.greenBg }}>
            <p className="text-xl font-black" style={{ color: COLORS.green }}>85%</p>
            <p className="text-[10px] font-bold" style={{ color: COLORS.gray600 }}>{t.avgAccuracy}</p>
          </div>
          <div className="p-3 rounded-2xl" style={{ background: COLORS.orangeBg }}>
            <p className="text-xl font-black" style={{ color: COLORS.orange }}>+{unit.signs.length * 10}</p>
            <p className="text-[10px] font-bold" style={{ color: COLORS.gray600 }}>{t.xpEarned}</p>
          </div>
        </div>
        <Button3D fullWidth size="lg" className="mt-5" onClick={onNext} icon={<ChevronRight size={18} />}>{t.nextLesson}</Button3D>
        <button onClick={onReview} className="mt-3 text-sm font-bold cursor-pointer" style={{ color: COLORS.gray500 }}>{t.reviewLesson}</button>
      </Card3D>
      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }`}</style>
    </div>
  )
}
