const LANDMARK_GROUPS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
}

const FINGER_NAMES_KO = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '새끼',
}

/**
 * Generate feedback message based on differing landmarks.
 */
export function generateFeedback(differingLandmarks, lang = 'en') {
  if (!differingLandmarks?.length) {
    return lang === 'ko' ? '잘하고 있어요!' : 'Good job!'
  }

  const top3 = differingLandmarks.slice(0, 3)
  const affectedFingers = new Set()

  for (const { index } of top3) {
    for (const [finger, indices] of Object.entries(LANDMARK_GROUPS)) {
      if (indices.includes(index)) {
        affectedFingers.add(finger)
      }
    }
  }

  if (affectedFingers.size === 0) {
    return lang === 'ko'
      ? '손목 위치를 조금 조정해 보세요.'
      : 'Adjust your wrist position slightly.'
  }

  if (lang === 'ko') {
    const fingerList = Array.from(affectedFingers).map((f) => FINGER_NAMES_KO[f]).join(', ')
    return `${fingerList} 손가락을 참고 영상에 맞게 조정해 보세요.`
  }

  const fingerList = Array.from(affectedFingers).join(', ')
  return `Adjust your ${fingerList} finger(s) to match the reference sign.`
}

/**
 * Generate arm/body position feedback.
 */
export function generatePoseFeedback(handPosition, refHandPosition, lang = 'en') {
  if (!handPosition || !refHandPosition) return ''

  const issues = []

  // Check hand height
  const heightDiff = Math.abs(handPosition.rightHandHeight - refHandPosition.rightHandHeight)
  if (heightDiff > 0.3) {
    if (handPosition.rightHandHeight < refHandPosition.rightHandHeight) {
      issues.push(lang === 'ko' ? '손을 더 위로 올려주세요' : 'Raise your hand higher')
    } else {
      issues.push(lang === 'ko' ? '손을 더 아래로 내려주세요' : 'Lower your hand')
    }
  }

  // Check hand forward position
  const forwardDiff = Math.abs(handPosition.rightHandForward - refHandPosition.rightHandForward)
  if (forwardDiff > 0.3) {
    if (handPosition.rightHandForward < refHandPosition.rightHandForward) {
      issues.push(lang === 'ko' ? '손을 더 앞으로 내밀어주세요' : 'Extend your hand forward more')
    } else {
      issues.push(lang === 'ko' ? '손을 몸 쪽으로 당겨주세요' : 'Bring your hand closer to your body')
    }
  }

  if (issues.length === 0) return ''
  return issues.join('. ') + '.'
}
