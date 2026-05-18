/**
 * Quiz Mode B — reverse inference question bank.
 *
 * Each entry maps a sign_id to:
 *   - category: one of the 5W1H buckets (who/what/where/when/how_feel/how_many)
 *   - questions: bilingual list of questions whose answer is this sign
 *
 * Distractor selection logic (in QuizMode):
 *   - Easy:  pick 3 random questions from DIFFERENT categories
 *   - Hard:  pick 3 random questions from the SAME category (different signs)
 *
 * Only signs listed here become quiz candidates. The pool stays small on
 * purpose — better to have a handful of well-crafted prompts than a noisy
 * auto-generated wall of options.
 */

export const QUIZ_BANK = [
  // ───── WHO ─────
  {
    signId: 'friend',
    category: 'who',
    questions: {
      ko: ['누구와 영화 보러 갔어요?', '누구를 가장 좋아해요?'],
      en: ['Who did you go to the movies with?', 'Who do you like the most?'],
    },
  },
  {
    signId: 'family',
    category: 'who',
    questions: {
      ko: ['누구와 살아요?', '누구를 가장 사랑해요?'],
      en: ['Who do you live with?', 'Who do you love the most?'],
    },
  },
  {
    signId: 'mom',
    category: 'who',
    questions: {
      ko: ['누가 요리를 해줘요?', '오늘 누구에게 전화했어요?'],
      en: ['Who cooks for you?', 'Who did you call today?'],
    },
  },
  {
    signId: 'dad',
    category: 'who',
    questions: {
      ko: ['누가 일하러 가요?', '누구한테 물어봤어요?'],
      en: ['Who goes to work?', 'Who did you ask?'],
    },
  },
  {
    signId: 'older_brother',
    category: 'who',
    questions: {
      ko: ['누가 같이 게임해요?', '누구한테 도움 받았어요?'],
      en: ['Who plays games with you?', 'Who helped you?'],
    },
  },

  // ───── WHAT ─────
  {
    signId: 'eat',
    category: 'what',
    questions: {
      ko: ['지금 뭐 하고 있어요?', '오늘 뭐 하고 싶어요?'],
      en: ['What are you doing now?', 'What do you want to do today?'],
    },
  },
  {
    signId: 'drink',
    category: 'what',
    questions: {
      ko: ['지금 뭐 하고 있어요?', '카페에서 뭐 해요?'],
      en: ['What are you doing now?', 'What do you do at the cafe?'],
    },
  },

  // ───── WHERE ─────
  {
    signId: 'school',
    category: 'where',
    questions: {
      ko: ['어디서 친구를 만났어요?', '어디로 가는 길이에요?'],
      en: ['Where did you meet your friend?', 'Where are you going?'],
    },
  },
  {
    signId: 'bathroom_where',
    category: 'where',
    questions: {
      ko: ['어디 가요?', '지금 어디 찾고 있어요?'],
      en: ['Where are you going?', 'What are you looking for?'],
    },
  },

  // ───── HOW (FEEL) ─────
  {
    signId: 'happy',
    category: 'how_feel',
    questions: {
      ko: ['오늘 기분 어때?', '시험 끝나고 어땠어요?'],
      en: ['How do you feel today?', 'How was it after the exam?'],
    },
  },
  {
    signId: 'sad',
    category: 'how_feel',
    questions: {
      ko: ['지금 기분이 어때요?', '왜 그래요?'],
      en: ['How do you feel right now?', 'What is wrong?'],
    },
  },
  {
    signId: 'angry',
    category: 'how_feel',
    questions: {
      ko: ['지금 어떤 기분이에요?', '왜 표정이 그래요?'],
      en: ['How are you feeling now?', 'Why do you look like that?'],
    },
  },
  {
    signId: 'tired',
    category: 'how_feel',
    questions: {
      ko: ['지금 컨디션 어때요?', '오늘 일 많았어요?'],
      en: ['How is your condition?', 'Was work tough today?'],
    },
  },
  {
    signId: 'love',
    category: 'how_feel',
    questions: {
      ko: ['그 사람에게 어떤 마음이에요?', '가족을 향한 마음은?'],
      en: ['How do you feel about them?', 'How do you feel about your family?'],
    },
  },

  // ───── HOW MANY (numbers) ─────
  {
    signId: 'num1',
    category: 'how_many',
    questions: {
      ko: ['몇 개 있어요?', '몇 명이에요?'],
      en: ['How many are there?', 'How many people?'],
    },
  },
  {
    signId: 'num3',
    category: 'how_many',
    questions: {
      ko: ['형제가 몇 명이에요?', '몇 번 했어요?'],
      en: ['How many siblings?', 'How many times?'],
    },
  },
  {
    signId: 'num10',
    category: 'how_many',
    questions: {
      ko: ['몇 명 왔어요?', '몇 분 걸려요?'],
      en: ['How many people came?', 'How many minutes does it take?'],
    },
  },
  {
    signId: 'num20',
    category: 'how_many',
    questions: {
      ko: ['몇 살이에요?', '몇 명이에요?'],
      en: ['How old are you?', 'How many people?'],
    },
  },
  {
    signId: 'num100',
    category: 'how_many',
    questions: {
      ko: ['몇 점 받았어요?', '얼마예요?'],
      en: ['What score did you get?', 'How much is it?'],
    },
  },

  // ───── HOW (manner / age via question) ─────
  {
    signId: 'age',
    category: 'how_many',
    questions: {
      ko: ['몇 살이에요?', '나이가 어떻게 돼요?'],
      en: ['How old are you?', 'What is your age?'],
    },
  },
]

/**
 * Pool of questions per 5W1H category, used to build distractor options.
 * These are GENERIC questions belonging to each bucket — chosen so that
 * "the right sign would be a different bucket".
 */
export const CATEGORY_QUESTIONS = {
  who: {
    ko: [
      '누구와 영화 보러 갔어요?',
      '누구를 만났어요?',
      '누구의 생일이에요?',
      '누구한테 전화했어요?',
    ],
    en: [
      'Who did you go to the movies with?',
      'Who did you meet?',
      'Whose birthday is it?',
      'Who did you call?',
    ],
  },
  what: {
    ko: [
      '어제 무엇을 먹었어요?',
      '뭐가 가장 좋아요?',
      '오늘 뭐 했어요?',
      '주말에 뭐 할 거예요?',
    ],
    en: [
      'What did you eat yesterday?',
      'What do you like the most?',
      'What did you do today?',
      'What are you doing this weekend?',
    ],
  },
  where: {
    ko: [
      '어디서 친구를 만났어요?',
      '어디로 가요?',
      '어디 살아요?',
      '어디서 공부해요?',
    ],
    en: [
      'Where did you meet your friend?',
      'Where are you going?',
      'Where do you live?',
      'Where do you study?',
    ],
  },
  when: {
    ko: [
      '언제 만나요?',
      '언제 도착해요?',
      '몇 시에 시작해요?',
      '언제 와요?',
    ],
    en: [
      'When are we meeting?',
      'When do you arrive?',
      'What time does it start?',
      'When are you coming?',
    ],
  },
  how_feel: {
    ko: [
      '오늘 기분 어때?',
      '몸 좀 괜찮아요?',
      '시험 어땠어요?',
      '지금 어떤 느낌이에요?',
    ],
    en: [
      'How do you feel today?',
      'How are you feeling?',
      'How was the exam?',
      'What does it feel like right now?',
    ],
  },
  how_many: {
    ko: [
      '몇 명이에요?',
      '몇 살이에요?',
      '얼마예요?',
      '몇 개 있어요?',
    ],
    en: [
      'How many people?',
      'How old are you?',
      'How much is it?',
      'How many are there?',
    ],
  },
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_QUESTIONS)

export function getQuizCandidates() {
  return QUIZ_BANK
}

/**
 * Build a question set for one round.
 *
 * @param {object} entry  one QUIZ_BANK entry (signId + category + questions)
 * @param {string} lang   'ko' | 'en'
 * @param {'easy'|'hard'} difficulty
 * @returns {{ correct: string, options: string[] }}
 */
export function buildOptions(entry, lang, difficulty = 'easy') {
  const langQuestions = entry.questions[lang]
  const correct = langQuestions[Math.floor(Math.random() * langQuestions.length)]

  const distractors = new Set()
  if (difficulty === 'hard') {
    // pick from same category, different signs
    const sameCat = QUIZ_BANK.filter((q) => q.category === entry.category && q.signId !== entry.signId)
    shuffle(sameCat).slice(0, 3).forEach((q) => {
      const opts = q.questions[lang]
      distractors.add(opts[Math.floor(Math.random() * opts.length)])
    })
    // fall back to other categories if we don't have 3
    if (distractors.size < 3) {
      addFromOtherCategories(distractors, entry.category, lang, 3)
    }
  } else {
    addFromOtherCategories(distractors, entry.category, lang, 3)
  }

  const options = shuffle([correct, ...Array.from(distractors).slice(0, 3)])
  return { correct, options }
}

function addFromOtherCategories(set, exceptCat, lang, n) {
  const cats = shuffle(ALL_CATEGORIES.filter((c) => c !== exceptCat))
  for (const cat of cats) {
    if (set.size >= n) break
    const pool = CATEGORY_QUESTIONS[cat][lang]
    set.add(pool[Math.floor(Math.random() * pool.length)])
  }
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Build a meaning-based round (video → which word does this sign mean?).
 *
 * Prefers distractors from the SAME 5W1H category so the wrong options
 * sound plausible (e.g. all "who" signs together).
 *
 * @param {object} entry        one QUIZ_BANK entry
 * @param {(id:string)=>object} resolveSign  (id) => sign record
 * @param {'ko'|'en'} lang
 * @returns {{ correctSignId, correctText, options: {signId, text}[] }}
 */
export function buildMeaningOptions(entry, resolveSign, lang) {
  const correctSign = resolveSign(entry.signId)
  if (!correctSign) return null
  const correctText = lang === 'ko' ? correctSign.name_ko : correctSign.name_en

  const sameCategory = QUIZ_BANK.filter((q) => q.category === entry.category && q.signId !== entry.signId)
  const otherCategory = QUIZ_BANK.filter((q) => q.category !== entry.category)

  const pool = [...shuffle(sameCategory), ...shuffle(otherCategory)]
  const distractors = []
  const seenText = new Set([correctText])
  for (const q of pool) {
    if (distractors.length >= 3) break
    const s = resolveSign(q.signId)
    if (!s) continue
    const text = lang === 'ko' ? s.name_ko : s.name_en
    if (seenText.has(text)) continue
    seenText.add(text)
    distractors.push({ signId: q.signId, text })
  }

  const options = shuffle([
    { signId: entry.signId, text: correctText },
    ...distractors,
  ])
  return { correctSignId: entry.signId, correctText, options }
}
