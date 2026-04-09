import { HandLandmarker, PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let handLandmarker = null
let poseLandmarker = null
let animationId = null
let isRunning = false
let initPromise = null

async function getLandmarkers() {
  if (handLandmarker && poseLandmarker) return { handLandmarker, poseLandmarker }
  if (initPromise) return initPromise

  initPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    )

    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    })

    console.log('[HandTracking] Hand + Pose landmarkers initialized')
    return { handLandmarker, poseLandmarker }
  })()

  return initPromise
}

export async function initializeHandTracking(videoElement, onResults) {
  const { handLandmarker: hl, poseLandmarker: pl } = await getLandmarkers()

  // Start webcam FIRST
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    })
    videoElement.srcObject = stream
    await videoElement.play()
  } catch (e) {
    console.error('Webcam access failed:', e)
    throw e
  }

  if (videoElement.readyState < 2) {
    await new Promise((resolve) => {
      videoElement.onloadeddata = resolve
      setTimeout(resolve, 3000)
    })
  }

  isRunning = true
  let lastTimestamp = -1

  const detect = () => {
    if (!isRunning) return

    const now = performance.now()
    if (videoElement.readyState >= 2 && videoElement.currentTime !== lastTimestamp) {
      lastTimestamp = videoElement.currentTime

      try {
        const handResults = hl.detectForVideo(videoElement, now)
        const poseResults = pl.detectForVideo(videoElement, now)

        const combined = {
          hands: {
            multiHandLandmarks: handResults.landmarks || [],
          },
          pose: {
            poseLandmarks: poseResults.landmarks?.[0] || null,
          },
        }
        onResults(combined)
      } catch {
        // Skip frame
      }
    }

    if (isRunning) {
      animationId = requestAnimationFrame(detect)
    }
  }

  detect()
}

export function stopHandTracking() {
  isRunning = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

/**
 * Analyze a single canvas/image frame.
 * Returns hand + pose landmarks for the frame.
 */
export async function analyzeFrame(canvas) {
  const { handLandmarker: hl, poseLandmarker: pl } = await getLandmarkers()

  // Switch to IMAGE mode for both
  hl.setOptions({ runningMode: 'IMAGE' })
  pl.setOptions({ runningMode: 'IMAGE' })

  try {
    const handResults = hl.detect(canvas)
    const poseResults = pl.detect(canvas)

    return {
      multiHandLandmarks: handResults.landmarks || [],
      poseLandmarks: poseResults.landmarks?.[0] || null,
    }
  } catch {
    return null
  } finally {
    // Switch back to VIDEO mode
    hl.setOptions({ runningMode: 'VIDEO' })
    pl.setOptions({ runningMode: 'VIDEO' })
  }
}

/**
 * Draw hand landmarks + pose skeleton on canvas.
 */
export function drawLandmarks(canvasElement, combinedResults) {
  const ctx = canvasElement.getContext('2d')
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

  const { hands, pose } = combinedResults

  // Pose skeleton (arms/shoulders/torso)
  if (pose?.poseLandmarks) {
    const pl = pose.poseLandmarks
    const connections = [
      [11, 13], [13, 15], // left arm
      [12, 14], [14, 16], // right arm
      [11, 12],           // shoulders
      [11, 23], [12, 24], // torso
      [23, 24],           // hips
    ]
    ctx.strokeStyle = '#4ADEFC'
    ctx.lineWidth = 3
    for (const [a, b] of connections) {
      if (pl[a] && pl[b]) {
        ctx.beginPath()
        ctx.moveTo(pl[a].x * canvasElement.width, pl[a].y * canvasElement.height)
        ctx.lineTo(pl[b].x * canvasElement.width, pl[b].y * canvasElement.height)
        ctx.stroke()
      }
    }
    // Joint dots
    for (const idx of [11, 12, 13, 14, 15, 16, 23, 24]) {
      if (pl[idx]) {
        ctx.beginPath()
        ctx.arc(pl[idx].x * canvasElement.width, pl[idx].y * canvasElement.height, 5, 0, 2 * Math.PI)
        ctx.fillStyle = '#1CB0F6'
        ctx.fill()
      }
    }
  }

  // Hand landmarks (drawn on top)
  if (hands?.multiHandLandmarks) {
    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ]
    for (const landmarks of hands.multiHandLandmarks) {
      ctx.strokeStyle = '#58CC02'
      ctx.lineWidth = 2
      for (const [a, b] of connections) {
        ctx.beginPath()
        ctx.moveTo(landmarks[a].x * canvasElement.width, landmarks[a].y * canvasElement.height)
        ctx.lineTo(landmarks[b].x * canvasElement.width, landmarks[b].y * canvasElement.height)
        ctx.stroke()
      }
      for (const p of landmarks) {
        ctx.beginPath()
        ctx.arc(p.x * canvasElement.width, p.y * canvasElement.height, 4, 0, 2 * Math.PI)
        ctx.fillStyle = '#FF4B4B'
        ctx.fill()
      }
    }
  }
}
