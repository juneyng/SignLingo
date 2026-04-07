import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Upload, Play, Download, Save, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D, ProgressBar, Badge } from '@/design-system/components'
import { normalizeLandmarks, normalizePoseLandmarks } from '@/utils/normalizeLandmarks'
import { ALL_SIGNS } from '@/data/signDatabase'
import useLanguage from '@/stores/useLanguage'

const CAPTURE_FPS = 10

export default function Analyze() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)
  const [selectedSignId, setSelectedSignId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customNameEn, setCustomNameEn] = useState('')
  const [modelsReady, setModelsReady] = useState(false)

  const handsRef = useRef(null)
  const poseRef = useRef(null)

  // Load MediaPipe models on mount
  useEffect(() => {
    loadModels()
    return () => {
      if (handsRef.current) handsRef.current.close()
      if (poseRef.current) poseRef.current.close()
    }
  }, [])

  async function loadModels() {
    setStatus(lang === 'ko' ? 'MediaPipe 모델 로딩 중...' : 'Loading MediaPipe models...')
    try {
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')
      await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js')

      handsRef.current = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      })
      handsRef.current.setOptions({
        maxNumHands: 2, modelComplexity: 1,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      })

      poseRef.current = new window.Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      })
      poseRef.current.setOptions({
        modelComplexity: 1, smoothLandmarks: true,
        minDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
      })

      // Warm up models with a blank canvas
      const warmupCanvas = document.createElement('canvas')
      warmupCanvas.width = 64; warmupCanvas.height = 64
      const ctx = warmupCanvas.getContext('2d')
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 64, 64)

      await new Promise((resolve) => {
        handsRef.current.onResults(() => resolve())
        handsRef.current.send({ image: warmupCanvas })
      })
      await new Promise((resolve) => {
        poseRef.current.onResults(() => resolve())
        poseRef.current.send({ image: warmupCanvas })
      })

      setModelsReady(true)
      setStatus(lang === 'ko' ? '모델 준비 완료! 영상을 업로드하세요.' : 'Models ready! Upload a video.')
    } catch (e) {
      setStatus(lang === 'ko' ? '모델 로딩 실패: ' + e.message : 'Model loading failed: ' + e.message)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setResult(null)
    setProgress(0)
    setStatus(lang === 'ko' ? '영상이 로드되었어요. "분석 시작"을 클릭하세요.' : 'Video loaded. Click "Start Analysis".')
  }

  async function startAnalysis() {
    if (!videoRef.current || !modelsReady) return

    setIsProcessing(true)
    setProgress(0)
    setResult(null)
    setStatus(lang === 'ko' ? '영상 분석 중...' : 'Analyzing video...')

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Wait for video metadata
    await new Promise((resolve) => {
      if (video.readyState >= 1) resolve()
      else video.onloadedmetadata = resolve
    })

    const duration = video.duration
    const totalFrames = Math.floor(duration * CAPTURE_FPS)
    const frameInterval = 1 / CAPTURE_FPS

    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const frames = []
    let handDetectedCount = 0
    let poseDetectedCount = 0

    // Process frame by frame
    for (let i = 0; i < totalFrames; i++) {
      const time = i * frameInterval
      video.currentTime = time

      // Wait for seek to complete
      await new Promise((resolve) => {
        video.onseeked = resolve
      })

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Extract hand landmarks
      let handData = null
      try {
        handData = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 2000)
          handsRef.current.onResults((results) => {
            clearTimeout(timeout)
            if (results.multiHandLandmarks?.length > 0) {
              const raw = results.multiHandLandmarks[0]
              resolve(normalizeLandmarks(raw.map(p => ({ x: p.x, y: p.y, z: p.z }))))
            } else {
              resolve(null)
            }
          })
          handsRef.current.send({ image: canvas })
        })
      } catch { handData = null }

      // Extract pose landmarks
      let poseData = null
      try {
        poseData = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 2000)
          poseRef.current.onResults((results) => {
            clearTimeout(timeout)
            if (results.poseLandmarks) {
              resolve(normalizePoseLandmarks(results.poseLandmarks))
            } else {
              resolve(null)
            }
          })
          poseRef.current.send({ image: canvas })
        })
      } catch { poseData = null }

      if (handData) handDetectedCount++
      if (poseData) poseDetectedCount++

      // Build feature vector
      if (handData) {
        const handFlat = handData.flat() // 63 values
        const poseFlat = poseData ? poseData.armLandmarks.flat() : Array(21).fill(0) // 21 values
        frames.push({
          t: time,
          features: [...handFlat, ...poseFlat],
          hand: handData,
          pose: poseData?.armLandmarks || null,
          handPosition: poseData?.handPosition || null,
        })
      }

      setProgress(((i + 1) / totalFrames) * 100)
      setStatus(lang === 'ko'
        ? `프레임 ${i + 1}/${totalFrames} 분석 중... (손: ${handDetectedCount}, 팔: ${poseDetectedCount})`
        : `Frame ${i + 1}/${totalFrames}... (hands: ${handDetectedCount}, pose: ${poseDetectedCount})`)
    }

    setIsProcessing(false)

    if (frames.length < 3) {
      setResult({ error: true, message: lang === 'ko' ? '손이 충분히 감지되지 않았어요. 다른 영상을 시도하세요.' : 'Not enough hand detections. Try another video.' })
      return
    }

    // Build reference data
    const sequence = frames.map(f => f.features)
    const midFrame = frames[Math.floor(frames.length / 2)]
    const avgPose = frames[0].pose ? averageArrays(frames.filter(f => f.pose).map(f => f.pose)) : null
    const avgHandPos = frames[0].handPosition ? averageObjects(frames.filter(f => f.handPosition).map(f => f.handPosition)) : null

    setResult({
      error: false,
      totalFrames: frames.length,
      totalVideoFrames: totalFrames,
      duration,
      handDetectedCount,
      poseDetectedCount,
      detectionRate: Math.round((handDetectedCount / totalFrames) * 100),
      sequence,
      landmarks: midFrame.hand,
      poseLandmarks: avgPose,
      refHandPosition: avgHandPos,
    })

    setStatus(lang === 'ko' ? '분석 완료!' : 'Analysis complete!')
  }

  function exportJSON() {
    if (!result || result.error) return
    const sign = selectedSignId ? ALL_SIGNS.find(s => s.id === selectedSignId) : null
    const data = {
      id: sign?.id || customNameEn.toLowerCase().replace(/\s+/g, '_') || 'custom_sign',
      name_ko: sign?.name_ko || customName || '수어',
      name_en: sign?.name_en || customNameEn || 'Sign',
      sequence: result.sequence,
      landmarks: result.landmarks,
      poseLandmarks: result.poseLandmarks,
      refHandPosition: result.refHandPosition,
      meta: {
        extractedAt: new Date().toISOString(),
        totalFrames: result.totalFrames,
        duration: result.duration,
        detectionRate: result.detectionRate,
        fps: CAPTURE_FPS,
      },
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `sign_${data.id}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function copySequence() {
    if (!result || result.error) return
    const data = { sequence: result.sequence, landmarks: result.landmarks, poseLandmarks: result.poseLandmarks, refHandPosition: result.refHandPosition }
    navigator.clipboard.writeText(JSON.stringify(data)).then(() => alert(lang === 'ko' ? '복사됨!' : 'Copied!'))
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-[fadeIn_0.5s_ease]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="cursor-pointer hover:scale-110 transition-transform">
          <ArrowLeft size={24} strokeWidth={2.5} color={COLORS.gray400} />
        </button>
        <h1 className="text-xl font-black" style={{ color: COLORS.gray800 }}>
          {lang === 'ko' ? '영상 분석 (참조 데이터 추출)' : 'Video Analysis (Extract Reference)'}
        </h1>
        <Badge color={COLORS.orange}>{lang === 'ko' ? '관리자 도구' : 'Admin Tool'}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left — Video */}
        <Card3D color={COLORS.gray200} padding="p-5">
          <h2 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '수어 영상' : 'Sign Video'}
          </h2>

          {/* Upload area */}
          {!videoUrl ? (
            <label
              className="flex flex-col items-center justify-center py-12 rounded-2xl cursor-pointer hover:scale-[1.01] transition-transform"
              style={{ border: `3px dashed ${COLORS.gray300}`, background: COLORS.gray50 }}
            >
              <Upload size={40} color={COLORS.gray400} strokeWidth={2} />
              <p className="font-bold text-sm mt-3" style={{ color: COLORS.gray500 }}>
                {lang === 'ko' ? '수어 영상 파일을 선택하세요' : 'Select a sign language video'}
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: COLORS.gray400 }}>
                MP4, WebM, MOV
              </p>
              <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
            </label>
          ) : (
            <div>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full rounded-2xl"
                style={{ border: `2px solid ${COLORS.gray200}` }}
                controls
                crossOrigin="anonymous"
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-2 mt-3">
                <label className="cursor-pointer">
                  <ButtonOutline color={COLORS.gray400} size="sm" icon={<Upload size={14} />}>
                    {lang === 'ko' ? '다른 영상' : 'Change'}
                  </ButtonOutline>
                  <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
                </label>
                <Button3D
                  size="sm" className="flex-1"
                  onClick={startAnalysis}
                  disabled={!modelsReady || isProcessing}
                  icon={<Play size={14} />}
                >
                  {isProcessing
                    ? (lang === 'ko' ? '분석 중...' : 'Analyzing...')
                    : (lang === 'ko' ? '분석 시작' : 'Start Analysis')}
                </Button3D>
              </div>
            </div>
          )}

          {/* Progress */}
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

        {/* Right — Settings & Result */}
        <div className="space-y-4">
          {/* Sign selection */}
          <Card3D color={COLORS.gray200} padding="p-5">
            <h2 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
              {lang === 'ko' ? '수어 이름' : 'Sign Name'}
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
              <option value="">{lang === 'ko' ? '— 기존 수어 선택 —' : '— Select sign —'}</option>
              {ALL_SIGNS.map(s => (
                <option key={s.id} value={s.id}>{s.name_ko} ({s.name_en})</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input type="text" placeholder={lang === 'ko' ? '한글' : 'Korean'}
                value={customName} onChange={e => setCustomName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl font-bold text-sm"
                style={{ border: `2px solid ${COLORS.gray200}` }} />
              <input type="text" placeholder={lang === 'ko' ? '영어' : 'English'}
                value={customNameEn} onChange={e => setCustomNameEn(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl font-bold text-sm"
                style={{ border: `2px solid ${COLORS.gray200}` }} />
            </div>
          </Card3D>

          {/* Result */}
          {result && (
            <Card3D
              color={result.error ? COLORS.red : COLORS.green}
              padding="p-5"
              className="animate-[fadeIn_0.3s_ease]"
            >
              {result.error ? (
                <div className="flex items-start gap-2">
                  <AlertTriangle size={20} color={COLORS.red} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-sm" style={{ color: COLORS.redDark }}>
                      {lang === 'ko' ? '분석 실패' : 'Analysis Failed'}
                    </p>
                    <p className="text-xs font-bold mt-1" style={{ color: COLORS.gray600 }}>{result.message}</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={18} color={COLORS.green} />
                    <p className="font-extrabold text-sm" style={{ color: COLORS.greenDark }}>
                      {lang === 'ko' ? '분석 완료!' : 'Analysis Complete!'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    <Stat label={lang === 'ko' ? '추출 프레임' : 'Frames'} value={result.totalFrames} color={COLORS.blue} />
                    <Stat label={lang === 'ko' ? '영상 길이' : 'Duration'} value={`${result.duration.toFixed(1)}s`} color={COLORS.green} />
                    <Stat label={lang === 'ko' ? '손 감지율' : 'Hand rate'} value={`${result.detectionRate}%`}
                      color={result.detectionRate >= 70 ? COLORS.green : COLORS.orange} />
                    <Stat label={lang === 'ko' ? '특징 벡터' : 'Features'} value={result.sequence[0]?.length || 0} color={COLORS.purple} />
                  </div>

                  <div className="flex gap-2">
                    <Button3D size="sm" onClick={exportJSON} icon={<Download size={14} />}>
                      JSON
                    </Button3D>
                    <ButtonOutline color={COLORS.blue} size="sm" onClick={copySequence} icon={<Save size={14} />}>
                      {lang === 'ko' ? '복사' : 'Copy'}
                    </ButtonOutline>
                    <ButtonOutline color={COLORS.gray400} size="sm" onClick={startAnalysis} icon={<RotateCcw size={14} />}>
                      {lang === 'ko' ? '재분석' : 'Redo'}
                    </ButtonOutline>
                  </div>
                </div>
              )}
            </Card3D>
          )}

          {/* How to use */}
          <Card3D color={COLORS.blue + '30'} padding="p-4">
            <p className="font-extrabold text-xs" style={{ color: COLORS.blue }}>
              {lang === 'ko' ? '사용 방법' : 'How to use'}
            </p>
            <ol className="text-xs font-bold mt-2 space-y-1" style={{ color: COLORS.gray700 }}>
              {(lang === 'ko' ? [
                '1. 국립국어원 수어사전에서 원하는 수어 영상을 다운로드하세요',
                '2. 위에서 영상 파일을 업로드하세요',
                '3. 수어 이름을 선택하거나 입력하세요',
                '4. "분석 시작" 클릭 → 자동으로 프레임별 랜드마크 추출',
                '5. JSON 다운로드 → signDatabase.js의 sequence 필드에 붙여넣기',
                '※ 손 감지율이 70% 이상이어야 신뢰할 수 있는 데이터입니다',
              ] : [
                '1. Download sign video from KSL dictionary (sldict.korean.go.kr)',
                '2. Upload the video file above',
                '3. Select or enter the sign name',
                '4. Click "Start Analysis" → auto-extracts landmarks per frame',
                '5. Download JSON → paste sequence into signDatabase.js',
                '※ Hand detection rate should be 70%+ for reliable data',
              ]).map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </Card3D>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
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

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.crossOrigin = 'anonymous'; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

function averageArrays(arrays) {
  if (arrays.length === 0) return null
  return arrays[0].map((_, i) => {
    const vals = arrays.map(a => a[i])
    return vals[0].map((_, j) => {
      const sum = vals.reduce((s, v) => s + v[j], 0)
      return Math.round((sum / vals.length) * 10000) / 10000
    })
  })
}

function averageObjects(objects) {
  if (objects.length === 0) return null
  const keys = Object.keys(objects[0])
  const result = {}
  for (const key of keys) {
    result[key] = Math.round((objects.reduce((s, o) => s + o[key], 0) / objects.length) * 10000) / 10000
  }
  return result
}
