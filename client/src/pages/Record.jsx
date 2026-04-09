import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Upload, Play, Square, Download, Save, RotateCcw, CheckCircle, AlertTriangle, Video, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D, ProgressBar, Badge } from '@/design-system/components'
import { initializeHandTracking, stopHandTracking, drawLandmarks, analyzeFrame } from '@/services/handTracking'
import { normalizeLandmarks, normalizePoseLandmarks } from '@/utils/normalizeLandmarks'
import { ALL_SIGNS } from '@/data/signDatabase'
import { saveRecordedSign, saveSignVideo } from '@/services/signStorage'
import useLanguage from '@/stores/useLanguage'

const RECORD_DURATION = 6
const CAPTURE_FPS = 8

export default function Record() {
  const navigate = useNavigate()
  const { lang } = useLanguage()

  // Tab: 'upload' or 'webcam'
  const [tab, setTab] = useState('upload')

  // Common state
  const [selectedSignId, setSelectedSignId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customNameEn, setCustomNameEn] = useState('')
  const [result, setResult] = useState(null)
  const [videoFile, setVideoFile] = useState(null) // uploaded video file for saving

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-[fadeIn_0.5s_ease]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="cursor-pointer hover:scale-110 transition-transform">
          <ArrowLeft size={24} strokeWidth={2.5} color={COLORS.gray400} />
        </button>
        <h1 className="text-xl font-black" style={{ color: COLORS.gray800 }}>
          {lang === 'ko' ? '참조 데이터 녹화' : 'Record Reference Data'}
        </h1>
        <Badge color={COLORS.orange}>{lang === 'ko' ? '관리자 도구' : 'Admin'}</Badge>
      </div>

      {/* Sign selection */}
      <Card3D color={COLORS.gray200} padding="p-4">
        <h2 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
          {lang === 'ko' ? '수어 선택' : 'Select Sign'}
        </h2>
        <select
          value={selectedSignId}
          onChange={(e) => {
            setSelectedSignId(e.target.value)
            const sign = ALL_SIGNS.find(s => s.id === e.target.value)
            if (sign) { setCustomName(sign.name_ko); setCustomNameEn(sign.name_en) }
          }}
          className="w-full px-3 py-2 rounded-xl font-bold text-sm mb-3"
          style={{ border: `2px solid ${COLORS.gray200}`, color: COLORS.gray800 }}
        >
          <option value="">{lang === 'ko' ? '— 수어 선택 —' : '— Select sign —'}</option>
          {ALL_SIGNS.map(s => (
            <option key={s.id} value={s.id}>{s.name_ko} ({s.name_en})</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input type="text" placeholder={lang === 'ko' ? '한글 이름' : 'Korean'}
            value={customName} onChange={e => setCustomName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl font-bold text-sm"
            style={{ border: `2px solid ${COLORS.gray200}` }} />
          <input type="text" placeholder={lang === 'ko' ? '영어 이름' : 'English'}
            value={customNameEn} onChange={e => setCustomNameEn(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl font-bold text-sm"
            style={{ border: `2px solid ${COLORS.gray200}` }} />
        </div>
      </Card3D>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button3D size="sm"
          color={tab === 'upload' ? COLORS.blue : COLORS.gray200}
          darkColor={tab === 'upload' ? COLORS.blueDark : COLORS.gray300}
          textColor={tab === 'upload' ? 'white' : COLORS.gray600}
          onClick={() => setTab('upload')}
          icon={<Upload size={14} />}>
          {lang === 'ko' ? '영상 업로드' : 'Upload Video'}
        </Button3D>
        <Button3D size="sm"
          color={tab === 'webcam' ? COLORS.green : COLORS.gray200}
          darkColor={tab === 'webcam' ? COLORS.greenDark : COLORS.gray300}
          textColor={tab === 'webcam' ? 'white' : COLORS.gray600}
          onClick={() => setTab('webcam')}
          icon={<Camera size={14} />}>
          {lang === 'ko' ? '직접 녹화' : 'Record Webcam'}
        </Button3D>
      </div>

      {/* Tab content */}
      {tab === 'upload' ? (
        <UploadTab lang={lang} result={result} setResult={setResult} setVideoFile={setVideoFile}
          selectedSignId={selectedSignId} customName={customName} customNameEn={customNameEn} />
      ) : (
        <WebcamTab lang={lang} result={result} setResult={setResult}
          selectedSignId={selectedSignId} customName={customName} customNameEn={customNameEn} />
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

// ============================================================
// TAB 1: Upload Video → MediaPipe Analysis
// ============================================================
function UploadTab({ lang, result, setResult, setVideoFile, selectedSignId, customName, customNameEn }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [videoFileLocal, setVideoFileLocal] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [modelsReady, setModelsReady] = useState(false)

  useEffect(() => {
    setModelsReady(true)
    setStatus(lang === 'ko' ? '준비 완료! 영상을 업로드하세요.' : 'Ready! Upload a video.')
  }, [])

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(URL.createObjectURL(file))
    setVideoFileLocal(file)
    if (setVideoFile) setVideoFile(file)
    setResult(null); setProgress(0)
    setStatus(lang === 'ko' ? '영상 로드됨. "분석 시작"을 클릭하세요.' : 'Video loaded. Click "Analyze".')
  }

  async function analyze() {
    if (!videoRef.current || !modelsReady) return
    setIsProcessing(true); setProgress(0); setResult(null)

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Ensure video is fully loaded
    await new Promise(r => { if (video.readyState >= 2) r(); else video.oncanplay = r })

    const duration = video.duration
    // Use fewer frames for short videos, more for longer ones
    const fps = Math.min(CAPTURE_FPS, Math.max(4, Math.floor(30 / duration)))
    const totalFrames = Math.max(1, Math.floor(duration * fps))
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    console.log(`[Analyze] Video: ${duration.toFixed(1)}s, ${canvas.width}x${canvas.height}, sampling at ${fps}fps → ${totalFrames} frames`)

    const frames = []
    let handCount = 0, poseCount = 0

    for (let i = 0; i < totalFrames; i++) {
      const targetTime = i / fps
      video.currentTime = targetTime

      // Wait for seek to complete + extra frame to ensure decode
      await new Promise(r => { video.onseeked = r })
      // Small delay to let the video frame fully decode
      await new Promise(r => setTimeout(r, 50))

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      await new Promise(r => setTimeout(r, 50))

      let handData = null
      let poseData = null
      try {
        const results = await analyzeFrame(canvas)
        if (results?.multiHandLandmarks?.length > 0) {
          handData = normalizeLandmarks(results.multiHandLandmarks[0].map(p => ({x:p.x,y:p.y,z:p.z})))
        }
        if (results?.poseLandmarks) {
          poseData = normalizePoseLandmarks(results.poseLandmarks)
        }
      } catch { /* skip frame */ }

      if (handData) handCount++
      if (poseData) poseCount++

      if (handData) {
        frames.push({
          t: targetTime,
          features: [...handData.flat(), ...(poseData ? poseData.armLandmarks.flat() : Array(21).fill(0))],
          hand: handData,
          pose: poseData?.armLandmarks || null,
          handPosition: poseData?.handPosition || null,
        })
      }

      setProgress(((i + 1) / totalFrames) * 100)
      setStatus(lang === 'ko' ? `${i+1}/${totalFrames} 프레임 (손: ${handCount}/${i+1})` : `Frame ${i+1}/${totalFrames} (hands: ${handCount}/${i+1})`)
    }

    console.log(`[Analyze] Done: ${handCount}/${totalFrames} hands, ${poseCount}/${totalFrames} pose, ${frames.length} valid frames`)

    setIsProcessing(false)
    buildResult(frames, totalFrames, duration, handCount, poseCount, setResult, setStatus, lang)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card3D color={COLORS.gray200} padding="p-5">
        <h2 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
          {lang === 'ko' ? '수어 영상 업로드' : 'Upload Sign Video'}
        </h2>

        {!videoUrl ? (
          <label className="flex flex-col items-center justify-center py-12 rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform"
            style={{ border: `3px dashed ${COLORS.gray300}`, background: COLORS.gray50 }}>
            <Upload size={40} color={COLORS.gray400} />
            <p className="font-bold text-sm mt-3" style={{ color: COLORS.gray500 }}>
              {lang === 'ko' ? '영상 파일 선택 (MP4, WebM)' : 'Select video (MP4, WebM)'}
            </p>
            <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
          </label>
        ) : (
          <div>
            <video ref={videoRef} src={videoUrl} className="w-full rounded-2xl" style={{ border: `2px solid ${COLORS.gray200}` }} controls crossOrigin="anonymous" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2 mt-3">
              <label className="cursor-pointer">
                <ButtonOutline color={COLORS.gray400} size="sm" icon={<Upload size={14} />}>
                  {lang === 'ko' ? '다른 영상' : 'Change'}
                </ButtonOutline>
                <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
              </label>
              <Button3D size="sm" className="flex-1" onClick={analyze} disabled={!modelsReady || isProcessing} icon={<Play size={14} />}>
                {isProcessing ? (lang === 'ko' ? '분석 중...' : 'Analyzing...') : (lang === 'ko' ? '분석 시작' : 'Analyze')}
              </Button3D>
            </div>
          </div>
        )}

        {(isProcessing || progress > 0) && (
          <div className="mt-3">
            <ProgressBar progress={progress} color={isProcessing ? COLORS.blue : COLORS.green} />
            <p className="text-xs font-bold mt-1" style={{ color: COLORS.gray500 }}>{status}</p>
          </div>
        )}
        {!isProcessing && progress === 0 && status && (
          <p className="text-xs font-bold mt-3" style={{ color: modelsReady ? COLORS.green : COLORS.orange }}>{status}</p>
        )}
      </Card3D>

      <ResultPanel result={result} lang={lang} selectedSignId={selectedSignId} customName={customName} customNameEn={customNameEn} videoFile={videoFileLocal} />
    </div>
  )
}

// ============================================================
// TAB 2: Webcam Recording
// ============================================================
function WebcamTab({ lang, result, setResult, selectedSignId, customName, customNameEn }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const latestRef = useRef({ hands: null, pose: null })

  const [isTracking, setIsTracking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordProgress, setRecordProgress] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [frameCount, setFrameCount] = useState(0)

  const framesRef = useRef([])
  const timerRef = useRef(null)
  const countdownRef = useRef(null)

  useEffect(() => {
    if (!videoRef.current) return
    let cancelled = false
    const handleResults = (results) => {
      latestRef.current = results
      if (canvasRef.current) drawLandmarks(canvasRef.current, results)
    }
    initializeHandTracking(videoRef.current, handleResults).then(() => {
      if (!cancelled) setIsTracking(true)
    })
    return () => { cancelled = true; stopHandTracking() }
  }, [])

  const startCountdown = () => {
    setResult(null); setCountdown(3)
    let count = 3
    countdownRef.current = setInterval(() => {
      count--; setCountdown(count)
      if (count <= 0) { clearInterval(countdownRef.current); startRecording() }
    }, 1000)
  }

  const startRecording = () => {
    framesRef.current = []; setIsRecording(true); setRecordProgress(0); setFrameCount(0)
    const startTime = Date.now()

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      setRecordProgress(Math.min(elapsed / RECORD_DURATION, 1))

      const { hands, pose } = latestRef.current
      let handData = null, poseData = null
      if (hands?.multiHandLandmarks?.length > 0) {
        handData = normalizeLandmarks(hands.multiHandLandmarks[0].map(p => ({x:p.x,y:p.y,z:p.z})))
      }
      if (pose?.poseLandmarks) poseData = normalizePoseLandmarks(pose.poseLandmarks)

      if (handData) {
        framesRef.current.push({
          t: elapsed,
          features: [...handData.flat(), ...(poseData ? poseData.armLandmarks.flat() : Array(21).fill(0))],
          hand: handData, pose: poseData?.armLandmarks || null, handPosition: poseData?.handPosition || null,
        })
        setFrameCount(framesRef.current.length)
      }

      if (elapsed >= RECORD_DURATION) {
        clearInterval(timerRef.current); setIsRecording(false)
        buildResult(framesRef.current, Math.floor(RECORD_DURATION * CAPTURE_FPS), RECORD_DURATION,
          framesRef.current.length, framesRef.current.filter(f => f.pose).length, setResult, () => {}, lang)
      }
    }, 1000 / CAPTURE_FPS)
  }

  useEffect(() => () => { clearInterval(timerRef.current); clearInterval(countdownRef.current) }, [])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card3D color={COLORS.gray200} padding="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-sm" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '웹캠 녹화' : 'Webcam Recording'}
          </h2>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: isTracking ? COLORS.greenBg : COLORS.yellowBg, color: isTracking ? COLORS.green : COLORS.orange }}>
            {isTracking ? (lang === 'ko' ? '추적 중' : 'Tracking') : (lang === 'ko' ? '로딩...' : 'Loading...')}
          </span>
        </div>

        {/* Backdrop when modal is active */}
        {(isRecording || countdown > 0) && (
          <div className="fixed inset-0 z-40 bg-black/70 animate-[fadeIn_0.3s_ease]" />
        )}

        <div
          className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
            (isRecording || countdown > 0) ? 'fixed top-1/2 left-1/2 z-50' : ''
          }`}
          style={{
            border: `3px ${isRecording ? 'solid' : 'dashed'} ${isRecording ? COLORS.red : COLORS.green}60`,
            ...((isRecording || countdown > 0) ? {
              width: '60vw',
              maxWidth: '900px',
              transform: 'translate(-50%, -50%)',
            } : {}),
          }}
        >
          <video ref={videoRef} className="w-full" autoPlay playsInline muted style={{ transform: 'scaleX(-1)' }} />
          <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" width={640} height={480} style={{ transform: 'scaleX(-1)' }} />

          {countdown > 0 && !isRecording && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-8xl font-black text-white animate-ping">{countdown}</span>
            </div>
          )}
          {isRecording && (
            <div className="absolute top-3 left-3 right-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: COLORS.red }} />
                <span className="text-xs font-black text-white drop-shadow">REC — {frameCount} frames</span>
                <span className="text-xs font-bold text-white/70 ml-auto">{Math.ceil(RECORD_DURATION - recordProgress * RECORD_DURATION)}s</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${recordProgress * 100}%`, background: COLORS.red }} />
              </div>
            </div>
          )}
        </div>

        <Button3D fullWidth className="mt-4" onClick={startCountdown}
          disabled={!isTracking || isRecording || countdown > 0}
          color={COLORS.green} darkColor={COLORS.greenDark} icon={<Play size={16} />}>
          {isRecording ? (lang === 'ko' ? '녹화 중...' : 'Recording...') : (lang === 'ko' ? '녹화 시작 (4초)' : 'Record (4s)')}
        </Button3D>
      </Card3D>

      <ResultPanel result={result} lang={lang} selectedSignId={selectedSignId} customName={customName} customNameEn={customNameEn} videoFile={null} />
    </div>
  )
}

// ============================================================
// Shared: Result Panel + Export
// ============================================================
function ResultPanel({ result, lang, selectedSignId, customName, customNameEn, videoFile }) {
  const [saved, setSaved] = useState(false)

  useEffect(() => { setSaved(false) }, [result])

  if (!result) {
    return (
      <Card3D color={COLORS.blue + '30'} padding="p-4">
        <p className="font-extrabold text-xs" style={{ color: COLORS.blue }}>
          {lang === 'ko' ? '사용 방법' : 'How to use'}
        </p>
        <ol className="text-xs font-bold mt-2 space-y-1" style={{ color: COLORS.gray700 }}>
          {(lang === 'ko' ? [
            '1. 위에서 수어를 선택하세요',
            '2. 영상 업로드 또는 웹캠 녹화',
            '3. 분석 결과를 확인하고 "레슨에 등록" 클릭',
          ] : [
            '1. Select the sign above',
            '2. Upload video or record from webcam',
            '3. Review results and click "Register"',
          ]).map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </Card3D>
    )
  }

  const handleRegister = async () => {
    if (!selectedSignId) {
      alert(lang === 'ko' ? '먼저 위에서 수어를 선택해주세요!' : 'Please select a sign first!')
      return
    }
    saveRecordedSign(selectedSignId, result)
    // Save video file to IndexedDB if available
    if (videoFile) {
      try {
        await saveSignVideo(selectedSignId, videoFile)
      } catch (e) {
        console.warn('Failed to save video:', e)
      }
    }
    setSaved(true)
  }

  const exportJSON = () => {
    const sign = selectedSignId ? ALL_SIGNS.find(s => s.id === selectedSignId) : null
    const data = {
      id: sign?.id || customNameEn.toLowerCase().replace(/\s+/g, '_') || 'sign',
      name_ko: sign?.name_ko || customName || '수어',
      name_en: sign?.name_en || customNameEn || 'Sign',
      sequence: result.sequence, landmarks: result.landmarks, poseLandmarks: result.poseLandmarks, refHandPosition: result.refHandPosition,
      meta: { extractedAt: new Date().toISOString(), totalFrames: result.totalFrames, duration: result.duration, detectionRate: result.detectionRate, fps: CAPTURE_FPS },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `sign_${data.id}.json`; a.click()
  }

  return (
    <Card3D color={result.error ? COLORS.red : COLORS.green} padding="p-5" className="animate-[fadeIn_0.3s_ease]">
      {result.error ? (
        <div className="flex items-start gap-2">
          <AlertTriangle size={20} color={COLORS.red} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-sm" style={{ color: COLORS.redDark }}>{lang === 'ko' ? '실패' : 'Failed'}</p>
            <p className="text-xs font-bold mt-1" style={{ color: COLORS.gray600 }}>{result.message}</p>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} color={COLORS.green} />
            <p className="font-extrabold text-sm" style={{ color: COLORS.greenDark }}>{lang === 'ko' ? '추출 완료!' : 'Extraction Complete!'}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <Stat label={lang === 'ko' ? '프레임' : 'Frames'} value={result.totalFrames} color={COLORS.blue} />
            <Stat label={lang === 'ko' ? '시간' : 'Duration'} value={`${result.duration.toFixed(1)}s`} color={COLORS.green} />
            <Stat label={lang === 'ko' ? '감지율' : 'Detection'} value={`${result.detectionRate}%`}
              color={result.detectionRate >= 70 ? COLORS.green : COLORS.orange} />
          </div>

          {result.detectionRate < 70 && (
            <div className="rounded-xl p-2 mb-3" style={{ background: COLORS.orangeBg, border: `2px solid ${COLORS.orange}30` }}>
              <p className="text-xs font-bold" style={{ color: COLORS.orangeDark }}>
                {lang === 'ko' ? '⚠️ 감지율이 낮아요. 더 선명한 영상으로 다시 시도하는 걸 추천해요.' : '⚠️ Low detection rate. Try a clearer video.'}
              </p>
            </div>
          )}

          {/* Register button */}
          {!saved ? (
            <Button3D fullWidth onClick={handleRegister} color={COLORS.green} darkColor={COLORS.greenDark}
              icon={<CheckCircle size={16} />} className="mb-3">
              {lang === 'ko'
                ? `${selectedSignId ? '"' + (ALL_SIGNS.find(s => s.id === selectedSignId)?.name_ko || selectedSignId) + '" 레슨에 등록' : '수어를 먼저 선택하세요'}`
                : `${selectedSignId ? 'Register for "' + (ALL_SIGNS.find(s => s.id === selectedSignId)?.name_en || selectedSignId) + '"' : 'Select a sign first'}`}
            </Button3D>
          ) : (
            <div className="rounded-xl p-3 mb-3 text-center" style={{ background: COLORS.greenLight, border: `2px solid ${COLORS.green}40` }}>
              <p className="font-extrabold text-sm" style={{ color: COLORS.greenDark }}>
                {lang === 'ko' ? '등록 완료! 레슨에서 바로 사용 가능합니다.' : 'Registered! Ready to use in lessons.'}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <ButtonOutline color={COLORS.gray400} size="sm" onClick={exportJSON} icon={<Download size={14} />}>JSON</ButtonOutline>
          </div>
        </div>
      )}
    </Card3D>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl p-2 text-center" style={{ background: color + '12' }}>
      <p className="text-lg font-black" style={{ color }}>{value}</p>
      <p className="text-[10px] font-bold" style={{ color: COLORS.gray500 }}>{label}</p>
    </div>
  )
}

// ============================================================
// Shared helpers
// ============================================================
function buildResult(frames, totalVideoFrames, duration, handCount, poseCount, setResult, setStatus, lang) {
  if (frames.length < 3) {
    setResult({ error: true, message: lang === 'ko' ? '손이 충분히 감지되지 않았어요. 다시 시도하세요.' : 'Not enough hand detections. Try again.' })
    return
  }

  const sequence = frames.map(f => f.features)
  const midFrame = frames[Math.floor(frames.length / 2)]
  const avgPose = frames[0].pose ? averageArrays(frames.filter(f => f.pose).map(f => f.pose)) : null
  const avgHandPos = frames[0].handPosition ? averageObjects(frames.filter(f => f.handPosition).map(f => f.handPosition)) : null

  const resultData = {
    error: false,
    totalFrames: frames.length,
    duration,
    detectionRate: Math.round((handCount / totalVideoFrames) * 100),
    sequence,
    landmarks: midFrame.hand,
    poseLandmarks: avgPose,
    refHandPosition: avgHandPos,
  }

  console.log('[Record] Extraction complete:', {
    totalFrames: frames.length,
    featureVectorLength: sequence[0]?.length,
    sampleFeature: sequence[0]?.slice(0, 6),
    handDetected: handCount,
    poseDetected: poseCount,
    detectionRate: resultData.detectionRate + '%',
  })

  setResult(resultData)
  setStatus(lang === 'ko' ? '완료!' : 'Done!')
}

function averageArrays(arrays) {
  if (!arrays.length) return null
  return arrays[0].map((_, i) => {
    const vals = arrays.map(a => a[i])
    return vals[0].map((_, j) => Math.round((vals.reduce((s, v) => s + v[j], 0) / vals.length) * 10000) / 10000)
  })
}

function averageObjects(objects) {
  if (!objects.length) return null
  const result = {}
  for (const key of Object.keys(objects[0])) {
    result[key] = Math.round((objects.reduce((s, o) => s + o[key], 0) / objects.length) * 10000) / 10000
  }
  return result
}
