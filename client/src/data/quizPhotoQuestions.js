/**
 * Quiz Mode A — Photo (or emoji scene) → Sign video selection.
 *
 * Each entry shows a scene (emoji + caption) and asks the user to
 * pick the sign video that names what's in the scene.
 *
 * scene:    { emoji, caption_ko, caption_en } — visual prompt
 * answerSignId: id of the correct sign (must exist in signDatabase)
 *
 * Distractor sign ids are sampled at runtime from other entries
 * (different answers) so we always get 3 wrong options that have
 * recorded reference videos to play.
 */

export const PHOTO_QUIZ_BANK = [
  // ───── EMOTIONS ─────
  { id: 'pq_happy',  scene: { emoji: '😄', caption_ko: '활짝 웃고 있어요', caption_en: 'Big smile' },         answerSignId: 'happy' },
  { id: 'pq_sad',    scene: { emoji: '😢', caption_ko: '눈물을 흘려요',     caption_en: 'Crying' },             answerSignId: 'sad' },
  { id: 'pq_angry',  scene: { emoji: '😡', caption_ko: '화가 났어요',       caption_en: 'Angry face' },         answerSignId: 'angry' },
  { id: 'pq_tired',  scene: { emoji: '😴', caption_ko: '졸려해요',           caption_en: 'Sleepy' },             answerSignId: 'tired' },
  { id: 'pq_love',   scene: { emoji: '❤️', caption_ko: '마음을 표현해요',    caption_en: 'Heart' },              answerSignId: 'love' },

  // ───── PEOPLE / FAMILY ─────
  { id: 'pq_mom',    scene: { emoji: '👩‍🍳', caption_ko: '엄마가 요리해요',  caption_en: 'Mom is cooking' },     answerSignId: 'mom' },
  { id: 'pq_dad',    scene: { emoji: '👨‍💼', caption_ko: '아빠가 출근해요',  caption_en: 'Dad goes to work' },   answerSignId: 'dad' },
  { id: 'pq_friend', scene: { emoji: '👯', caption_ko: '친구와 놀아요',      caption_en: 'Hanging out with a friend' }, answerSignId: 'friend' },
  { id: 'pq_family', scene: { emoji: '👨‍👩‍👧‍👦', caption_ko: '가족이 함께 있어요', caption_en: 'Family together' },      answerSignId: 'family' },

  // ───── ACTIONS ─────
  { id: 'pq_eat',    scene: { emoji: '🍚', caption_ko: '밥을 먹어요',         caption_en: 'Eating a meal' },     answerSignId: 'eat' },
  { id: 'pq_drink',  scene: { emoji: '🥤', caption_ko: '음료를 마셔요',       caption_en: 'Drinking' },           answerSignId: 'drink' },
  { id: 'pq_go',     scene: { emoji: '🚶', caption_ko: '어딘가로 가요',       caption_en: 'Walking somewhere' },  answerSignId: 'go' },

  // ───── PLACES ─────
  { id: 'pq_school', scene: { emoji: '🏫', caption_ko: '학교 건물',            caption_en: 'A school building' },  answerSignId: 'school' },

  // ───── GREETINGS ─────
  { id: 'pq_hello',  scene: { emoji: '👋', caption_ko: '인사하는 모습',        caption_en: 'Waving hello' },       answerSignId: 'hello' },
  { id: 'pq_sorry',  scene: { emoji: '🙏', caption_ko: '사과하는 모습',        caption_en: 'Apologizing' },        answerSignId: 'sorry' },
]

/**
 * Pick 3 distractor sign ids that:
 *   - are NOT the correct answer
 *   - come from other PHOTO_QUIZ_BANK entries (so they're known signs)
 */
function pickDistractorSignIds(correctSignId, n = 3) {
  const candidates = PHOTO_QUIZ_BANK
    .map((e) => e.answerSignId)
    .filter((id) => id !== correctSignId)
  return shuffle(candidates).slice(0, n)
}

/**
 * Build one round for Mode A.
 *
 * @returns {{ scene, options: string[], correctSignId: string }}
 *   options: 4 sign ids, shuffled
 */
export function buildPhotoRound(entry) {
  const distractors = pickDistractorSignIds(entry.answerSignId, 3)
  const options = shuffle([entry.answerSignId, ...distractors])
  return {
    scene: entry.scene,
    options,
    correctSignId: entry.answerSignId,
  }
}

export function pickRandomPhotoEntry(excludeIds = new Set()) {
  const pool = PHOTO_QUIZ_BANK.filter((e) => !excludeIds.has(e.id))
  const candidates = pool.length > 0 ? pool : PHOTO_QUIZ_BANK
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
