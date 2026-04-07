import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

let handLandmarker = null
let animationId = null
let isRunning = false
let initPromise = null

/**
 * Get or create the shared HandLandmarker instance.
 * Uses @mediapipe/tasks-vision (new API, proper ESM, Vite compatible).
 */
async function getHandLandmarker() {
  if (handLandmarker) return handLandmarker
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

    console.log('[HandTracking] HandLandmarker initialized (tasks-vision)')
    return handLandmarker
  })()

  return initPromise
}

/**
 * Initialize hand tracking with live webcam.
 */
export async function initializeHandTracking(videoElement, onResults) {
  const landmarker = await getHandLandmarker()

  // Need webcam to be playing
  if (videoElement.readyState < 2) {
    await new Promise(r => { videoElement.onloadeddata = r })
  }

  isRunning = true
  let lastTimestamp = -1

  const detect = () => {
    if (!isRunning || !landmarker) return

    const now = performance.now()
    if (videoElement.readyState >= 2 && videoElement.currentTime !== lastTimestamp) {
      lastTimestamp = videoElement.currentTime

      try {
        const results = landmarker.detectForVideo(videoElement, now)

        // Convert to our format (compatible with existing normalization/comparison code)
        const combined = {
          hands: {
            multiHandLandmarks: results.landmarks || [],
          },
          pose: null,
        }

        onResults(combined)
      } catch (e) {
        // Skip frame
      }
    }

    if (isRunning) {
      animationId = requestAnimationFrame(detect)
    }
  }

  // Start webcam
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480 },
    })
    videoElement.srcObject = stream
    await videoElement.play()
  } catch (e) {
    console.error('Webcam access failed:', e)
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
 * Analyze a single canvas/image frame (for video upload analysis).
 * Uses IMAGE mode on the shared landmarker.
 */
export async function analyzeFrame(canvas) {
  const landmarker = await getHandLandmarker()

  // Temporarily switch to IMAGE mode
  landmarker.setOptions({ runningMode: 'IMAGE' })

  try {
    const results = landmarker.detect(canvas)
    return {
      multiHandLandmarks: results.landmarks || [],
    }
  } catch {
    return null
  } finally {
    // Switch back to VIDEO mode for live tracking
    landmarker.setOptions({ runningMode: 'VIDEO' })
  }
}

/**
 * Draw hand landmarks on canvas.
 */
export function drawLandmarks(canvasElement, combinedResults) {
  const ctx = canvasElement.getContext('2d')
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

  const { hands } = combinedResults
  if (!hands?.multiHandLandmarks) return

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
