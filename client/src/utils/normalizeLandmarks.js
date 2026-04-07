/**
 * Normalize hand landmarks: wrist as origin, scale by palm size.
 * @param {Array} landmarks - 21 MediaPipe hand landmarks
 * @returns {Array|null} Normalized [[x,y,z], ...] for 21 points
 */
export function normalizeLandmarks(landmarks) {
  if (!landmarks || landmarks.length !== 21) return null

  const wrist = landmarks[0]
  const middleMcp = landmarks[9]

  const palmSize = Math.sqrt(
    (middleMcp.x - wrist.x) ** 2 +
    (middleMcp.y - wrist.y) ** 2 +
    (middleMcp.z - wrist.z) ** 2
  )
  if (palmSize === 0) return null

  return landmarks.map((p) => [
    (p.x - wrist.x) / palmSize,
    (p.y - wrist.y) / palmSize,
    (p.z - wrist.z) / palmSize,
  ])
}

/**
 * Extract and normalize arm/body position relative to shoulder midpoint.
 * Uses MediaPipe Pose landmarks for upper body.
 *
 * Returns normalized positions of: shoulders, elbows, wrists
 * relative to shoulder center, scaled by shoulder width.
 *
 * @param {Array} poseLandmarks - 33 MediaPipe pose landmarks
 * @returns {Object|null} { armLandmarks: [[x,y,z],...], shoulderWidth, handPosition }
 */
export function normalizePoseLandmarks(poseLandmarks) {
  if (!poseLandmarks || poseLandmarks.length < 25) return null

  const ls = poseLandmarks[11] // left shoulder
  const rs = poseLandmarks[12] // right shoulder
  const le = poseLandmarks[13] // left elbow
  const re = poseLandmarks[14] // right elbow
  const lw = poseLandmarks[15] // left wrist
  const rw = poseLandmarks[16] // right wrist
  const nose = poseLandmarks[0]

  // Shoulder center as origin
  const cx = (ls.x + rs.x) / 2
  const cy = (ls.y + rs.y) / 2
  const cz = (ls.z + rs.z) / 2

  // Shoulder width for scale
  const shoulderWidth = Math.sqrt(
    (rs.x - ls.x) ** 2 + (rs.y - ls.y) ** 2 + (rs.z - ls.z) ** 2
  )
  if (shoulderWidth === 0) return null

  const normalize = (p) => [
    (p.x - cx) / shoulderWidth,
    (p.y - cy) / shoulderWidth,
    (p.z - cz) / shoulderWidth,
  ]

  // 7 key points: nose, left/right shoulder, elbow, wrist
  const armLandmarks = [nose, ls, rs, le, re, lw, rw].map(normalize)

  // Hand position relative to body (useful for sign type detection)
  const handPosition = {
    rightHandHeight: (cy - rw.y) / shoulderWidth, // positive = above shoulders
    leftHandHeight: (cy - lw.y) / shoulderWidth,
    rightHandForward: (cz - rw.z) / shoulderWidth,
    leftHandForward: (cz - lw.z) / shoulderWidth,
  }

  return { armLandmarks, shoulderWidth, handPosition }
}

/**
 * Combine hand landmarks + pose landmarks into a single feature vector.
 * This gives us hand shape + arm position for full sign comparison.
 *
 * @param {Array} handLandmarks - Normalized hand landmarks (21 points)
 * @param {Object} poseData - From normalizePoseLandmarks
 * @returns {Object} { handFeatures, poseFeatures, combined }
 */
export function combineFeatures(handLandmarks, poseData) {
  const handFeatures = handLandmarks ? handLandmarks.flat() : null
  const poseFeatures = poseData ? poseData.armLandmarks.flat() : null

  return {
    handFeatures,   // 63 values (21 * 3)
    poseFeatures,   // 21 values (7 * 3)
    combined: handFeatures && poseFeatures
      ? [...handFeatures, ...poseFeatures] // 84 values total
      : handFeatures || poseFeatures || [],
  }
}
