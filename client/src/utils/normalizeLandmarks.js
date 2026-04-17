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

  // Indices: 0=nose, 7/8=ears, 9/10=mouth, 11/12=shoulders,
  //          13/14=elbows, 15/16=wrists, 17-22=hand tips, 23/24=hips
  const points = [0, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
  for (const idx of [11, 12]) {
    if (!poseLandmarks[idx]) return null
  }

  const ls = poseLandmarks[11]
  const rs = poseLandmarks[12]

  // Shoulder center as origin
  const cx = (ls.x + rs.x) / 2
  const cy = (ls.y + rs.y) / 2
  const cz = (ls.z + rs.z) / 2

  // Shoulder width for scale
  const shoulderWidth = Math.sqrt(
    (rs.x - ls.x) ** 2 + (rs.y - ls.y) ** 2 + (rs.z - ls.z) ** 2
  )
  if (shoulderWidth === 0) return null

  const normalize = (p) => {
    if (!p) return [0, 0, 0]
    return [
      (p.x - cx) / shoulderWidth,
      (p.y - cy) / shoulderWidth,
      ((p.z || 0) - cz) / shoulderWidth,
    ]
  }

  // 19 key points: face refs + shoulders + elbows + wrists + hand tips + hips
  const armLandmarks = points.map(i => normalize(poseLandmarks[i]))

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
    poseFeatures,   // 57 values (19 * 3)
    combined: handFeatures && poseFeatures
      ? [...handFeatures, ...poseFeatures] // 120 values total
      : handFeatures || poseFeatures || [],
  }
}
