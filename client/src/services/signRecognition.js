import { normalizeLandmarks, normalizePoseLandmarks, combineFeatures } from '../utils/normalizeLandmarks'
import { compareSignFull, findDifferingLandmarks } from '../utils/compareSigns'
import { generateFeedback, generatePoseFeedback } from '../utils/feedbackGenerator'

/**
 * Process combined MediaPipe results (hands + pose) and compare against a reference sign.
 * @param {Object} combinedResults - { hands, pose } from handTracking
 * @param {Object} referenceSign - Reference sign data with landmarks and optional poseLandmarks
 * @param {string} lang - 'en' or 'ko' for feedback language
 * @returns {{ score, handScore, poseScore, feedback, feedbackType }}
 */
export function evaluateSign(combinedResults, referenceSign, lang = 'en') {
  const { hands, pose } = combinedResults

  let normalizedHand = null
  if (hands?.multiHandLandmarks?.length > 0) {
    const raw = hands.multiHandLandmarks[0]
    normalizedHand = normalizeLandmarks(raw.map((p) => ({ x: p.x, y: p.y, z: p.z })))
  }

  let poseData = null
  if (pose?.poseLandmarks) {
    poseData = normalizePoseLandmarks(pose.poseLandmarks)
  }

  if (!normalizedHand && !poseData) {
    return { score: 0, handScore: 0, poseScore: 0, feedback: '', feedbackType: 'hint', normalized: null }
  }

  const features = combineFeatures(normalizedHand, poseData)
  const result = compareSignFull(features, referenceSign)

  let feedback = ''
  let feedbackType = 'hint'

  if (result.score >= 80) {
    feedback = lang === 'ko' ? '잘했어요! 수어가 정확히 인식되었어요!' : 'Great job! Sign recognized correctly!'
    feedbackType = 'success'
  } else {
    const msgs = []
    if (normalizedHand && result.handScore < 80) {
      const differing = findDifferingLandmarks(normalizedHand, referenceSign.landmarks)
      msgs.push(generateFeedback(differing, lang))
    }
    if (poseData && referenceSign.poseLandmarks && result.poseScore < 80 && referenceSign.refHandPosition) {
      const poseFb = generatePoseFeedback(poseData.handPosition, referenceSign.refHandPosition, lang)
      if (poseFb) msgs.push(poseFb)
    }
    feedback = msgs.join(' ')
    feedbackType = result.score >= 50 ? 'hint' : 'error'
  }

  return {
    score: result.score,
    handScore: result.handScore,
    poseScore: result.poseScore,
    feedback,
    feedbackType,
    normalized: normalizedHand,
  }
}
