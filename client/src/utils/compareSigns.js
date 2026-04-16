import { dtw, compareSequences, analyzeErrors } from './dtw'
import { getRecordedSign } from '@/services/signStorage'

/**
 * Convert DTW distance to 0-100 score.
 *
 * Observed distance ranges (84-dim vectors, normalized DTW):
 *   - Same sign, same person: 1.0 ~ 2.0
 *   - Same sign, different person: 2.0 ~ 4.0
 *   - Different sign: 4.0 ~ 8.0+
 *
 * Scoring: linear mapping within observed range.
 */
function dtwToScore(distance) {
  // Calibrated thresholds based on real data
  const PERFECT = 1.0  // distance below this → 100
  const PASS = 3.5     // distance at this → ~80 (pass threshold)
  const FAIL = 6.0     // distance above this → 0

  if (distance <= PERFECT) return 100
  if (distance >= FAIL) return 0

  // Linear interpolation between PERFECT and FAIL
  const score = 100 * (1 - (distance - PERFECT) / (FAIL - PERFECT))
  console.log(`[Score] distance=${distance.toFixed(3)} → score=${Math.round(score)}`)
  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * Cosine similarity between two flat vectors.
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  if (normA === 0 || normB === 0) return 0
  return dot / (normA * normB)
}

/**
 * Euclidean distance between two flat vectors.
 */
function euclideanDistance(a, b) {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2
  }
  return Math.sqrt(sum)
}

/**
 * OLD: Compare single-frame hand landmarks (for backward compat with dummy data).
 */
export function compareSigns(userLandmarks, referenceLandmarks) {
  if (!userLandmarks || !referenceLandmarks) return 0
  if (userLandmarks.length !== referenceLandmarks.length) return 0
  const userFlat = userLandmarks.flat()
  const refFlat = referenceLandmarks.flat()
  const similarity = cosineSimilarity(userFlat, refFlat)
  return Math.round(Math.max(0, Math.min(100, ((similarity + 1) / 2) * 100)))
}

/**
 * OLD: Single-frame weighted comparison.
 */
export function compareSignFull(userFeatures, refSign, weights = { hand: 0.6, pose: 0.4 }) {
  let handScore = 50, poseScore = 50

  if (userFeatures.handFeatures && refSign.landmarks) {
    const refFlat = refSign.landmarks.flat()
    const similarity = cosineSimilarity(userFeatures.handFeatures, refFlat)
    handScore = Math.max(0, Math.min(100, ((similarity + 1) / 2) * 100))
  }
  if (userFeatures.poseFeatures && refSign.poseLandmarks) {
    const refFlat = refSign.poseLandmarks.flat()
    const similarity = cosineSimilarity(userFeatures.poseFeatures, refFlat)
    poseScore = Math.max(0, Math.min(100, ((similarity + 1) / 2) * 100))
  }

  const usesPose = !!refSign.poseLandmarks
  const w = usesPose ? weights : { hand: 1, pose: 0 }
  const score = Math.round(handScore * w.hand + poseScore * w.pose)
  return { score, handScore: Math.round(handScore), poseScore: Math.round(poseScore) }
}

/**
 * NEW: Compare recorded user sequence against reference sequence using DTW.
 * This is the PRIMARY comparison method when reference has recorded sequence data.
 *
 * @param {number[][]} userSequence - Array of feature vectors from user recording
 * @param {Object} refSign - Reference sign from database
 * @returns {{ score, handScore, poseScore, hasSequence }}
 */
export function compareRecordedSign(userSequence, refSign) {
  // Check Supabase cache for recorded reference data
  const localRef = getRecordedSign(refSign.id)
  const sequence = localRef?.sequence || refSign.sequence

  // If reference has sequence data (from Supabase), use DTW
  if (sequence && sequence.length > 0) {
    const userLen = userSequence[0]?.length || 0
    const refLen = sequence[0]?.length || 0

    // Ensure same feature length
    let userSeq = userSequence
    let refSeq = sequence
    if (userLen !== refLen) {
      console.warn(`[DTW] Feature vector mismatch: user=${userLen}, ref=${refLen}. Trimming.`)
      const minLen = Math.min(userLen, refLen)
      userSeq = userSequence.map(f => f.slice(0, minLen))
      refSeq = sequence.map(f => f.slice(0, minLen))
    }

    // Separate DTW for hand (first 63 dims) and pose (dims 63-83)
    const handDims = Math.min(63, userSeq[0].length)
    const userHand = userSeq.map(f => f.slice(0, handDims))
    const refHand = refSeq.map(f => f.slice(0, handDims))
    const handDtw = dtw(userHand, refHand)
    const handScore = dtwToScore(handDtw.distance)

    let poseScore = -1 // -1 means no pose data
    if (userSeq[0].length > 63 && refSeq[0].length > 63) {
      const userPose = userSeq.map(f => f.slice(63))
      const refPose = refSeq.map(f => f.slice(63))
      // Check if pose data is actually present (not all zeros)
      const hasRealPose = userPose.some(f => f.some(v => v !== 0)) && refPose.some(f => f.some(v => v !== 0))
      if (hasRealPose) {
        const poseDtw = dtw(userPose, refPose)
        poseScore = dtwToScore(poseDtw.distance)
      }
    }

    // Weighted total: if no pose, hand is 100%
    const total = poseScore >= 0
      ? Math.round(handScore * 0.6 + poseScore * 0.4)
      : handScore

    console.log(`[DTW] hand: dist=${handDtw.distance.toFixed(3)}→${handScore}%, pose: ${poseScore >= 0 ? poseScore + '%' : 'N/A'}, total: ${total}%`)
    console.log(`[DTW] userFrames=${userSeq.length}, refFrames=${refSeq.length}, featureLen=${userSeq[0].length}`)

    return {
      score: total,
      handScore,
      poseScore: poseScore >= 0 ? poseScore : handScore,
      hasSequence: true,
    }
  }

  // Fallback: no recorded sequence data, use single-frame comparison
  // This will be inaccurate (as you discovered!)
  if (userSequence.length === 0) return { score: 0, handScore: 0, poseScore: 0, hasSequence: false }

  // Average all user frames, compare against static landmarks
  const avgFrame = averageVectors(userSequence)
  const handLen = 63
  const userHand = avgFrame.slice(0, handLen)
  const userPose = avgFrame.slice(handLen)

  let handScore = 50
  if (refSign.landmarks) {
    const refFlat = refSign.landmarks.flat()
    const sim = cosineSimilarity(userHand, refFlat)
    handScore = Math.max(0, Math.min(100, ((sim + 1) / 2) * 100))
  }

  let poseScore = 50
  if (refSign.poseLandmarks) {
    const refFlat = refSign.poseLandmarks.flat()
    const sim = cosineSimilarity(userPose, refFlat)
    poseScore = Math.max(0, Math.min(100, ((sim + 1) / 2) * 100))
  }

  const usesPose = !!refSign.poseLandmarks
  const w = usesPose ? { hand: 0.6, pose: 0.4 } : { hand: 1, pose: 0 }
  const score = Math.round(handScore * w.hand + poseScore * w.pose)

  return { score, handScore: Math.round(handScore), poseScore: Math.round(poseScore), hasSequence: false }
}

function averageVectors(vectors) {
  if (vectors.length === 0) return []
  const len = vectors[0].length
  const result = Array(len).fill(0)
  for (const v of vectors) {
    for (let i = 0; i < len; i++) result[i] += v[i]
  }
  return result.map(v => v / vectors.length)
}

/**
 * Find which landmarks differ most from reference (for feedback).
 */
export function findDifferingLandmarks(userLandmarks, referenceLandmarks) {
  if (!userLandmarks || !referenceLandmarks) return []
  return userLandmarks
    .map((point, index) => ({
      index,
      distance: euclideanDistance(point, referenceLandmarks[index]),
    }))
    .sort((a, b) => b.distance - a.distance)
}
