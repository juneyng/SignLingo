/**
 * DTW (Dynamic Time Warping) for comparing sign language motion sequences.
 *
 * Each frame is a flat feature vector combining:
 *   - Normalized hand landmarks (21 * 3 = 63 values)
 *   - Normalized pose landmarks (7 * 3 = 21 values)
 *   Total: up to 84 values per frame
 *
 * DTW aligns two sequences of different lengths and computes
 * the optimal matching cost — handles speed variations in signing.
 */

/**
 * Euclidean distance between two flat vectors.
 */
function vectorDistance(a, b) {
  if (a.length !== b.length) return Infinity
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2
  }
  return Math.sqrt(sum)
}

/**
 * Core DTW algorithm.
 * @param {number[][]} seq1 - User sequence (array of feature vectors)
 * @param {number[][]} seq2 - Reference sequence (array of feature vectors)
 * @returns {{ distance: number, path: [number, number][] }}
 */
export function dtw(seq1, seq2) {
  const n = seq1.length
  const m = seq2.length

  if (n === 0 || m === 0) return { distance: Infinity, path: [] }

  // Cost matrix
  const cost = Array.from({ length: n }, () => Array(m).fill(Infinity))
  cost[0][0] = vectorDistance(seq1[0], seq2[0])

  // First row
  for (let j = 1; j < m; j++) {
    cost[0][j] = cost[0][j - 1] + vectorDistance(seq1[0], seq2[j])
  }
  // First col
  for (let i = 1; i < n; i++) {
    cost[i][0] = cost[i - 1][0] + vectorDistance(seq1[i], seq2[0])
  }
  // Fill
  for (let i = 1; i < n; i++) {
    for (let j = 1; j < m; j++) {
      const d = vectorDistance(seq1[i], seq2[j])
      cost[i][j] = d + Math.min(cost[i - 1][j], cost[i][j - 1], cost[i - 1][j - 1])
    }
  }

  // Normalized distance (by path length)
  const distance = cost[n - 1][m - 1] / (n + m)

  return { distance }
}

/**
 * Compare two sign sequences using DTW and return a 0-100 score.
 *
 * The scoring uses an empirically-tuned sigmoid:
 *   - distance ≈ 0 → score 100
 *   - distance ≈ threshold → score ~50
 *   - distance >> threshold → score ~0
 *
 * @param {number[][]} userSeq - User's captured frame vectors
 * @param {number[][]} refSeq - Reference sign frame vectors
 * @param {number} threshold - Distance at which score = 50 (default: 0.5)
 * @returns {number} Score 0-100
 */
export function compareSequences(userSeq, refSeq, threshold = 0.5) {
  if (!userSeq?.length || !refSeq?.length) return 0

  const { distance } = dtw(userSeq, refSeq)

  // Sigmoid-based scoring: score = 100 / (1 + e^(k*(d - threshold)))
  // k controls steepness (higher = stricter)
  const k = 6
  const score = 100 / (1 + Math.exp(k * (distance - threshold)))

  return Math.round(Math.max(0, Math.min(100, score)))
}

/**
 * Analyze which body parts differ most between user and reference.
 * Compares DTW-aligned frame pairs.
 *
 * @param {number[][]} userSeq
 * @param {number[][]} refSeq
 * @returns {{ handError: number, poseError: number, worstFrameIdx: number }}
 */
export function analyzeErrors(userSeq, refSeq) {
  if (!userSeq?.length || !refSeq?.length) {
    return { handError: 1, poseError: 1, worstFrameIdx: 0 }
  }

  // Simple approach: compare evenly-sampled frames
  const len = Math.min(userSeq.length, refSeq.length)
  let totalHandErr = 0
  let totalPoseErr = 0
  let worstErr = 0
  let worstIdx = 0

  for (let i = 0; i < len; i++) {
    const ui = Math.floor((i / len) * userSeq.length)
    const ri = Math.floor((i / len) * refSeq.length)
    const u = userSeq[ui]
    const r = refSeq[ri]

    // Hand features are first 63 values (21 landmarks * 3)
    const handLen = Math.min(63, u.length, r.length)
    let handErr = 0
    for (let j = 0; j < handLen; j++) {
      handErr += (u[j] - r[j]) ** 2
    }
    handErr = Math.sqrt(handErr / handLen)

    // Pose features are values 63-83
    let poseErr = 0
    if (u.length > 63 && r.length > 63) {
      const poseLen = Math.min(u.length, r.length) - 63
      for (let j = 63; j < 63 + poseLen; j++) {
        poseErr += (u[j] - r[j]) ** 2
      }
      poseErr = Math.sqrt(poseErr / poseLen)
    }

    totalHandErr += handErr
    totalPoseErr += poseErr

    const frameErr = handErr + poseErr
    if (frameErr > worstErr) {
      worstErr = frameErr
      worstIdx = i
    }
  }

  return {
    handError: totalHandErr / len,
    poseError: totalPoseErr / len,
    worstFrameIdx: worstIdx,
  }
}
