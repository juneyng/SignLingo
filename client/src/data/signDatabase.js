/**
 * SignLingo Sign Database
 *
 * 모든 수어 데이터를 한 곳에서 관리합니다.
 * landmark / poseLandmarks 데이터는 placeholder입니다.
 * → scripts/recordSign.js 또는 /record 페이지로 실제 데이터를 녹화해서 교체하세요.
 *
 * 각 사인 구조:
 *   id, name_ko, name_en, category, type, difficulty,
 *   landmarks (21 hand points), poseLandmarks (7 body points, nullable),
 *   refHandPosition (nullable), description, description_ko, tips, tips_ko
 */

// --- Placeholder landmark generators ---
// 실제 녹화 데이터로 교체 전까지 사용하는 더미 데이터
const OPEN_HAND = [
  [0,0,0],[.15,-.05,-.03],[.3,-.08,-.05],[.35,-.05,-.04],[.38,-.02,-.03],
  [.25,-.55,-.02],[.28,-.8,-.03],[.25,-.92,-.02],[.22,-.98,-.01],
  [.1,-.55,-.01],[.12,-.8,0],[.1,-.92,.01],[.08,-.98,.02],
  [-.05,-.5,0],[-.03,-.72,.01],[-.05,-.85,.02],[-.07,-.92,.03],
  [-.18,-.42,.02],[-.18,-.62,.03],[-.2,-.75,.04],[-.22,-.82,.05]
]
const FIST = [
  [0,0,0],[.2,-.1,-.05],[.35,-.15,-.08],[.4,-.1,-.06],[.42,-.05,-.04],
  [.2,-.55,-.02],[.2,-.35,-.03],[.2,-.28,-.02],[.2,-.22,-.01],
  [.05,-.5,-.01],[.05,-.32,0],[.05,-.25,.01],[.05,-.2,.02],
  [-.1,-.45,0],[-.1,-.3,.01],[-.1,-.24,.02],[-.1,-.2,.03],
  [-.22,-.38,.02],[-.22,-.28,.03],[-.22,-.22,.04],[-.22,-.18,.05]
]
const INDEX_UP = [
  [0,0,0],[.2,-.1,-.05],[.35,-.08,-.07],[.4,-.03,-.05],[.42,.02,-.03],
  [.2,-.55,-.02],[.22,-.85,-.03],[.2,-.95,-.02],[.18,-1,-.01],
  [.05,-.5,-.01],[.05,-.32,0],[.05,-.25,.01],[.05,-.2,.02],
  [-.1,-.45,0],[-.1,-.3,.01],[-.1,-.24,.02],[-.1,-.2,.03],
  [-.22,-.38,.02],[-.22,-.28,.03],[-.22,-.22,.04],[-.22,-.18,.05]
]

const POSE_NEUTRAL = [
  [0,-1.2,-.1],[-.5,0,0],[.5,0,0],[-.4,.4,0],[.4,.4,0],[-.3,.7,.05],[.3,.7,.05]
]
const POSE_HIGH = [
  [0,-1.2,-.1],[-.5,0,0],[.5,0,0],[-.3,.3,0],[.2,.2,-.15],[-.2,.6,.05],[0,-.3,-.15]
]
const POSE_FRONT = [
  [0,-1.2,-.1],[-.5,0,0],[.5,0,0],[-.6,.5,.05],[.3,.4,-.1],[-.5,.9,.1],[.1,-.3,-.15]
]
const POSE_CHEST = [
  [0,-1.2,-.1],[-.5,0,0],[.5,0,0],[-.4,.3,0],[.3,.15,-.1],[-.3,.6,.05],[.05,-.2,-.2]
]

function makeSign(id, name_ko, name_en, category, opts = {}) {
  return {
    id,
    name_ko,
    name_en,
    category,
    type: opts.type || 'static',
    difficulty: opts.difficulty || 1,
    landmarks: opts.landmarks || OPEN_HAND,
    poseLandmarks: opts.poseLandmarks || null,
    refHandPosition: opts.refHandPosition || null,
    description: opts.description || '',
    description_ko: opts.description_ko || '',
    tips: opts.tips || '',
    tips_ko: opts.tips_ko || '',
  }
}

// ============================================================
// UNIT 0: 한글 자모 / 지문자 (KSL Fingerspelling) — 29 signs
// 자음 14개 + 모음 10개 + 겹받침 5개. 처음 수어를 접하는 사람을 위한 입문 단원.
// ============================================================
const consonantData = [
  { id: 'ksl_g',  ko: 'ㄱ', en: 'Giyeok',       desc: 'Index + thumb form a corner shape',         desc_ko: '검지와 엄지로 ㄱ자 모양 만들기' },
  { id: 'ksl_n',  ko: 'ㄴ', en: 'Nieun',        desc: 'Index extended horizontally',                desc_ko: '검지를 옆으로 펴기' },
  { id: 'ksl_d',  ko: 'ㄷ', en: 'Digeut',       desc: 'Thumb + index + middle form ㄷ shape',       desc_ko: '엄지·검지·중지로 ㄷ모양' },
  { id: 'ksl_r',  ko: 'ㄹ', en: 'Rieul',        desc: 'Bent fingers form zigzag like ㄹ',           desc_ko: '손가락을 구부려 ㄹ자 형태' },
  { id: 'ksl_m',  ko: 'ㅁ', en: 'Mieum',        desc: 'Closed fist with all fingertips together',   desc_ko: '손가락 끝을 모아 사각형' },
  { id: 'ksl_b',  ko: 'ㅂ', en: 'Bieup',        desc: 'Index + middle up, others folded',           desc_ko: '검지·중지를 펴고 나머지 접기' },
  { id: 'ksl_s',  ko: 'ㅅ', en: 'Siot',         desc: 'Index + middle spread apart like legs',      desc_ko: '검지·중지를 V자로 벌리기' },
  { id: 'ksl_ng', ko: 'ㅇ', en: 'Ieung',        desc: 'Thumb + index form a circle',                desc_ko: '엄지와 검지로 동그라미' },
  { id: 'ksl_j',  ko: 'ㅈ', en: 'Jieut',        desc: 'Index + middle crossed forming X',           desc_ko: '검지·중지를 교차해 X자' },
  { id: 'ksl_ch', ko: 'ㅊ', en: 'Chieut',       desc: 'ㅈ shape with thumb pointing up',             desc_ko: 'ㅈ 모양에 엄지를 위로' },
  { id: 'ksl_k',  ko: 'ㅋ', en: 'Kieuk',        desc: 'ㄱ shape with extra finger extension',        desc_ko: 'ㄱ 모양에 손가락 하나 더' },
  { id: 'ksl_t',  ko: 'ㅌ', en: 'Tieut',        desc: 'ㄷ shape with thumb across',                  desc_ko: 'ㄷ 모양에 엄지를 가로로' },
  { id: 'ksl_p',  ko: 'ㅍ', en: 'Pieup',        desc: 'Index + middle + ring extended downward',    desc_ko: '검지·중지·약지를 아래로' },
  { id: 'ksl_h',  ko: 'ㅎ', en: 'Hieut',        desc: 'ㅇ shape with index pointing up',             desc_ko: 'ㅇ 모양에 검지를 위로' },
]

const vowelData = [
  { id: 'ksl_a',   ko: 'ㅏ', en: 'A',   desc: 'Index finger points to the right',                desc_ko: '검지를 오른쪽으로 가리키기' },
  { id: 'ksl_ya',  ko: 'ㅑ', en: 'Ya',  desc: 'Index + middle point to the right',               desc_ko: '검지·중지를 오른쪽으로' },
  { id: 'ksl_eo',  ko: 'ㅓ', en: 'Eo',  desc: 'Index finger points to the left',                 desc_ko: '검지를 왼쪽으로 가리키기' },
  { id: 'ksl_yeo', ko: 'ㅕ', en: 'Yeo', desc: 'Index + middle point to the left',                desc_ko: '검지·중지를 왼쪽으로' },
  { id: 'ksl_o',   ko: 'ㅗ', en: 'O',   desc: 'Index finger points upward',                      desc_ko: '검지를 위로 가리키기' },
  { id: 'ksl_yo',  ko: 'ㅛ', en: 'Yo',  desc: 'Index + middle point upward',                     desc_ko: '검지·중지를 위로' },
  { id: 'ksl_u',   ko: 'ㅜ', en: 'U',   desc: 'Index finger points downward',                    desc_ko: '검지를 아래로 가리키기' },
  { id: 'ksl_yu',  ko: 'ㅠ', en: 'Yu',  desc: 'Index + middle point downward',                   desc_ko: '검지·중지를 아래로' },
  { id: 'ksl_eu',  ko: 'ㅡ', en: 'Eu',  desc: 'Flat hand horizontal, palm down',                 desc_ko: '편 손을 수평으로, 손바닥은 아래' },
  { id: 'ksl_i',   ko: 'ㅣ', en: 'I',   desc: 'Pinky finger extended upward',                    desc_ko: '새끼손가락을 위로 세우기' },
]

const doubleConsonantData = [
  { id: 'ksl_lm', ko: 'ㄻ', en: 'Rieul-Mieum',  desc: 'ㄹ + ㅁ combined',                            desc_ko: 'ㄹ과 ㅁ을 연속으로' },
  { id: 'ksl_lb', ko: 'ㄼ', en: 'Rieul-Bieup',  desc: 'ㄹ + ㅂ combined',                            desc_ko: 'ㄹ과 ㅂ을 연속으로' },
  { id: 'ksl_bs', ko: 'ㅄ', en: 'Bieup-Siot',   desc: 'ㅂ + ㅅ combined',                            desc_ko: 'ㅂ과 ㅅ을 연속으로' },
  { id: 'ksl_lh', ko: 'ㅀ', en: 'Rieul-Hieut',  desc: 'ㄹ + ㅎ combined',                            desc_ko: 'ㄹ과 ㅎ을 연속으로' },
  { id: 'ksl_ls', ko: 'ㄽ', en: 'Rieul-Siot',   desc: 'ㄹ + ㅅ combined',                            desc_ko: 'ㄹ과 ㅅ을 연속으로' },
]

const unit0 = [
  ...consonantData.map((c) =>
    makeSign(c.id, c.ko, c.en, 'fingerspelling', {
      type: 'static',
      difficulty: 1,
      landmarks: INDEX_UP,
      description: c.desc,
      description_ko: c.desc_ko,
      tips: 'Hold the shape clearly for 1-2 seconds',
      tips_ko: '모양을 1-2초간 명확하게 유지하세요',
    })
  ),
  ...vowelData.map((v) =>
    makeSign(v.id, v.ko, v.en, 'fingerspelling', {
      type: 'static',
      difficulty: 1,
      landmarks: INDEX_UP,
      description: v.desc,
      description_ko: v.desc_ko,
      tips: 'Hold the direction clearly for 1-2 seconds',
      tips_ko: '방향을 1-2초간 명확하게 유지하세요',
    })
  ),
  ...doubleConsonantData.map((c) =>
    makeSign(c.id, c.ko, c.en, 'fingerspelling', {
      type: 'dynamic',
      difficulty: 2,
      landmarks: INDEX_UP,
      description: c.desc,
      description_ko: c.desc_ko,
      tips: 'Perform two consonant shapes in sequence',
      tips_ko: '두 자음을 순서대로 표현하세요',
    })
  ),
]

// ============================================================
// UNIT 1: 인사 (Greetings) — 6 signs
// ============================================================
const unit1 = [
  makeSign('hello', '안녕하세요', 'Hello', 'greetings', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .3, leftHandHeight: -.5, rightHandForward: .15, leftHandForward: 0 },
    description: 'Open palm facing outward, bow head slightly',
    description_ko: '손바닥을 펴서 앞으로 향하게 하고 가볍게 인사',
    tips: 'Keep all fingers together and straight',
    tips_ko: '손가락을 모두 모아 펴세요',
  }),
  makeSign('thankyou', '감사합니다', 'Thank You', 'greetings', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .2, leftHandForward: 0 },
    description: 'Place flat hand on forehead, bring forward and down',
    description_ko: '편 손을 이마에 대고 앞으로 내려서 인사',
    tips: 'Start at forehead, smooth arc downward',
    tips_ko: '이마에서 시작해 부드럽게 내리세요',
  }),
  makeSign('sorry', '죄송합니다', 'Sorry', 'greetings', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .8, leftHandHeight: -.3, rightHandForward: .2, leftHandForward: 0 },
    description: 'Make a fist, rub in circle on chest',
    description_ko: '주먹을 쥐고 가슴 위에서 원을 그리며 돌리기',
    tips: 'Gentle circular motion',
    tips_ko: '부드럽게 원을 그리세요',
  }),
  makeSign('nicetomeet', '만나서 반갑습니다', 'Nice to Meet You', 'greetings', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .2, leftHandHeight: .2, rightHandForward: .3, leftHandForward: .3 },
    description: 'Both palms open, bring together in front',
    description_ko: '양손을 펴서 앞에서 모으며 인사',
    tips: 'Both hands move toward each other',
    tips_ko: '양손을 앞에서 부드럽게 모으세요',
  }),
  makeSign('please_takecare', '잘 부탁드립니다', 'Please Take Care of Me', 'greetings', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .25, leftHandForward: .25 },
    description: 'Both hands together in front, slight bow forward',
    description_ko: '양손을 모아 앞으로 내밀고 가볍게 숙이기',
    tips: 'Hands form a respectful gesture together',
    tips_ko: '두 손을 정중하게 모으세요',
  }),
  makeSign('eaten_yet', '식사 하셨어요?', 'Have You Eaten?', 'greetings', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Bring fingertips to mouth, then tilt head questioningly',
    description_ko: '손끝을 입으로 가져간 후 고개를 갸웃 (질문 표정)',
    tips: 'Eating motion + questioning facial expression',
    tips_ko: '먹는 동작 후 의문의 표정을 지으세요',
  }),
]

// ============================================================
// UNIT 2: 기본 응답 (Basic Responses) — 6 signs
// ============================================================
const unit2 = [
  makeSign('yes', '네', 'Yes', 'responses', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_NEUTRAL,
    refHandPosition: { rightHandHeight: 0, leftHandHeight: -.4, rightHandForward: .1, leftHandForward: 0 },
    description: 'Fist nods forward from wrist',
    description_ko: '주먹을 쥐고 손목에서 앞으로 끄덕이기',
    tips: 'Like your fist is nodding',
    tips_ko: '주먹이 고개를 끄덕이듯 움직이세요',
  }),
  makeSign('no', '아니요', 'No', 'responses', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_NEUTRAL,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .2, leftHandForward: 0 },
    description: 'Open hand waves side to side in front of face',
    description_ko: '손을 펴서 얼굴 앞에서 좌우로 흔들기',
    tips: 'Palm faces forward',
    tips_ko: '손바닥이 앞을 향하게 하세요',
  }),
  makeSign('okay', '괜찮아요', "It's Okay", 'responses', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .3, leftHandHeight: -.4, rightHandForward: .15, leftHandForward: 0 },
    description: 'Open hand pats chest gently',
    description_ko: '편 손으로 가슴을 가볍게 쓸어내리기',
    tips: 'Gentle downward stroke on chest',
    tips_ko: '가슴을 부드럽게 쓸어내리세요',
  }),
  makeSign('dontknow', '모르겠어요', "I Don't Know", 'responses', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .5, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Open hand touches forehead, then turns palm up',
    description_ko: '편 손으로 이마를 터치한 후 손바닥을 위로',
    tips: 'Shrug-like gesture after touching forehead',
    tips_ko: '이마를 터치한 후 어깨를 으쓱하듯이',
  }),
  makeSign('help', '도와주세요', 'Help Me', 'responses', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .3, leftHandForward: .3 },
    description: 'Fist on open palm, push upward together',
    description_ko: '주먹을 편 손바닥 위에 놓고 함께 올리기',
    tips: 'Left palm flat, right fist on top, push up',
    tips_ko: '왼손을 펴고 오른쪽 주먹을 올려서 함께 위로',
  }),
  makeSign('wait', '기다려주세요', 'Please Wait', 'responses', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .25, leftHandForward: 0 },
    description: 'Palm facing down, pat air gently downward',
    description_ko: '손바닥을 아래로 향하게 하고 공기를 누르듯 아래로',
    tips: 'Calm, slow pushing motion',
    tips_ko: '차분하게 천천히 누르세요',
  }),
]

// ============================================================
// UNIT 3: 자기소개 (Self Introduction) — 7 signs
// ============================================================
const unit3 = [
  makeSign('me', '나/저', 'I / Me', 'intro', {
    landmarks: INDEX_UP, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .3, leftHandHeight: -.4, rightHandForward: 0, leftHandForward: 0 },
    description: 'Point index finger to your own chest',
    description_ko: '검지로 자신의 가슴을 가리키기',
    tips: 'Clear pointing motion to yourself',
    tips_ko: '자신을 명확하게 가리키세요',
  }),
  makeSign('you', '당신', 'You', 'intro', {
    landmarks: INDEX_UP, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .3, leftHandForward: 0 },
    description: 'Point index finger forward toward the other person',
    description_ko: '검지로 상대방을 가리키기',
    tips: 'Point gently, not aggressively',
    tips_ko: '부드럽게 가리키세요',
  }),
  makeSign('name', '이름', 'Name', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .2, leftHandHeight: .2, rightHandForward: .2, leftHandForward: .2 },
    description: 'Two index fingers cross in an X shape',
    description_ko: '양 검지를 X자로 교차하기',
    tips: 'Cross index fingers in front of chest',
    tips_ko: '가슴 앞에서 검지를 교차하세요',
  }),
  makeSign('student', '학생', 'Student', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .5, leftHandHeight: .3, rightHandForward: .15, leftHandForward: .15 },
    description: 'Mime opening a book, then point to self',
    description_ko: '책을 펴는 동작 후 자신을 가리키기',
    tips: 'Open palms like book pages, then point to chest',
    tips_ko: '책 펴듯 양손을 펴고, 가슴을 가리키세요',
  }),
  makeSign('school', '학교', 'School', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .2, leftHandHeight: .2, rightHandForward: .2, leftHandForward: .2 },
    description: 'Both palms open and close like a book',
    description_ko: '양손을 펴서 책처럼 열고 닫기',
    tips: 'Hands face each other, open and close',
    tips_ko: '양손을 마주보게 하고 열고 닫으세요',
  }),
  makeSign('friend', '친구', 'Friend', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .25, leftHandForward: .25 },
    description: 'Hook index fingers together',
    description_ko: '양쪽 검지를 서로 걸기',
    tips: 'Interlock curved index fingers',
    tips_ko: '구부린 검지를 서로 걸어주세요',
  }),
  makeSign('age', '나이', 'Age', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .5, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Index finger near temple, slight twist',
    description_ko: '검지를 관자놀이 옆에 두고 살짝 돌리기',
    tips: 'Used in questions like "How old are you?"',
    tips_ko: '"몇 살이에요?" 질문에 사용됩니다',
  }),
]

// ============================================================
// UNIT 4: 감정 (Emotions) — 10 signs
// ============================================================
const unit4 = [
  makeSign('good', '좋아요', 'Good / Like', 'emotions', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .2, leftHandForward: 0 },
    description: 'Thumbs up',
    description_ko: '엄지를 위로 올리기',
    tips: 'Classic thumbs up gesture',
    tips_ko: '엄지를 확실하게 올리세요',
  }),
  makeSign('bad', '싫어요', 'Bad / Dislike', 'emotions', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .2, leftHandForward: 0 },
    description: 'Thumbs down',
    description_ko: '엄지를 아래로 내리기',
    tips: 'Thumbs down, slight wrist rotation',
    tips_ko: '엄지를 확실하게 내리세요',
  }),
  makeSign('happy', '행복해요', 'Happy', 'emotions', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .4, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Flat hand circles upward over chest',
    description_ko: '편 손을 가슴 위에서 위로 원을 그리기',
    tips: 'Upward circular motion shows positive emotion',
    tips_ko: '위쪽 방향으로 원을 그리세요',
  }),
  makeSign('sad', '슬퍼요', 'Sad', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Open hands slide down face',
    description_ko: '편 손을 얼굴에서 아래로 쓸어내리기',
    tips: 'Like tears falling down face',
    tips_ko: '눈물이 흐르듯 얼굴을 쓸어내리세요',
  }),
  makeSign('angry', '화나요', 'Angry', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .15, leftHandForward: 0 },
    description: 'Claw hand pulls away from face',
    description_ko: '손을 구부려서 얼굴 앞에서 바깥으로 당기기',
    tips: 'Tense, pulling motion from face outward',
    tips_ko: '얼굴에서 바깥으로 강하게 당기세요',
  }),
  makeSign('tired', '피곤해요', 'Tired', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .3, leftHandHeight: .3, rightHandForward: .05, leftHandForward: .05 },
    description: 'Both hands on chest, drop down',
    description_ko: '양손을 가슴에 대고 아래로 떨어뜨리기',
    tips: 'Hands start on upper chest, drop as body droops',
    tips_ko: '가슴 위에서 힘없이 아래로 떨어뜨리세요',
  }),
  makeSign('fear', '두려워하다', 'Fear', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .3, leftHandHeight: .3, rightHandForward: .15, leftHandForward: .15 },
    description: 'Both hands tremble in front of chest',
    description_ko: '양손을 가슴 앞에서 떨듯이 흔들기',
    tips: 'Slight trembling motion shows fear',
    tips_ko: '떨리는 동작으로 두려움을 표현하세요',
  }),
  makeSign('surprise', '놀라다', 'Surprise', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .7, leftHandHeight: .7, rightHandForward: .15, leftHandForward: .15 },
    description: 'Both hands open suddenly near face',
    description_ko: '양손을 얼굴 옆에서 갑자기 펴기',
    tips: 'Sharp opening motion + wide eyes',
    tips_ko: '갑작스럽게 손을 펴고 눈을 크게 뜨세요',
  }),
  makeSign('love', '사랑하다', 'Love', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .3, leftHandHeight: .3, rightHandForward: .05, leftHandForward: .05 },
    description: 'Crossed fists pressed to chest',
    description_ko: '주먹을 교차하여 가슴에 대기',
    tips: 'Both arms cross over heart',
    tips_ko: '양팔을 가슴 위에서 교차하세요',
  }),
  makeSign('relief', '안도하다', 'Relief', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .4, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Open hand pats chest with exhaling motion',
    description_ko: '편 손으로 가슴을 쓸어내리며 한숨 돌리기',
    tips: 'Slow downward stroke with relaxed expression',
    tips_ko: '편안한 표정으로 가슴을 천천히 쓸어내리세요',
  }),
]

// ============================================================
// UNIT 5: 숫자 (Numbers 1-10) — 10 signs
// ============================================================
const numLandmarks = (idx) => {
  // Numbers 1-5: extend that many fingers. 6-10: variations
  const base = [...FIST.map(p => [...p])]
  // Simplified: extend fingers based on number
  const fingerTips = [[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]
  const extend = Math.min(idx, 5)
  for (let i = 0; i < extend && i < 4; i++) {
    for (const j of fingerTips[i]) {
      base[j] = [base[j][0], base[j][1] - .4, base[j][2]]
    }
  }
  return base
}

const unit5 = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1
  const tips_map = {
    1: { en: 'Extend index finger only', ko: '검지만 펴세요' },
    2: { en: 'Index + middle finger', ko: '검지와 중지를 펴세요' },
    3: { en: 'Index + middle + ring finger', ko: '검지, 중지, 약지를 펴세요' },
    4: { en: 'Four fingers open, thumb tucked', ko: '네 손가락을 펴고 엄지는 접으세요' },
    5: { en: 'All five fingers open', ko: '다섯 손가락 모두 펴세요' },
    6: { en: 'Open hand, thumb touches pinky', ko: '손을 펴고 엄지와 새끼를 닿게' },
    7: { en: 'Open hand, thumb touches ring finger', ko: '손을 펴고 엄지와 약지를 닿게' },
    8: { en: 'Open hand, thumb touches middle finger', ko: '손을 펴고 엄지와 중지를 닿게' },
    9: { en: 'Open hand, thumb touches index finger', ko: '손을 펴고 엄지와 검지를 닿게' },
    10: { en: 'Fist with thumb up, twist wrist', ko: '주먹에서 엄지를 세우고 손목 비틀기' },
  }
  return makeSign(`num${n}`, `${n}`, `${n}`, 'numbers', {
    difficulty: n <= 5 ? 1 : 2,
    landmarks: numLandmarks(n),
    description: `Number ${n} in KSL`,
    description_ko: `숫자 ${n}`,
    tips: tips_map[n]?.en || '',
    tips_ko: tips_map[n]?.ko || '',
  })
})

// ============================================================
// UNIT 6: 가족 (Family) — 7 signs
// ============================================================
const unit6 = [
  makeSign('family', '가족', 'Family', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .2, leftHandForward: .2 },
    description: 'Both hands circle outward forming a group',
    description_ko: '양손을 바깥으로 원을 그리며 모으기',
    tips: 'Circle motion represents gathering',
    tips_ko: '가족이 모이는 느낌으로 원을 그리세요',
  }),
  makeSign('dad', '아빠', 'Dad', 'family', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .7, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Index finger taps forehead',
    description_ko: '검지로 이마를 두드리기',
    tips: 'Tap forehead twice with index finger',
    tips_ko: '검지로 이마를 두 번 두드리세요',
  }),
  makeSign('mom', '엄마', 'Mom', 'family', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .4, leftHandHeight: -.3, rightHandForward: .05, leftHandForward: 0 },
    description: 'Index finger taps chin',
    description_ko: '검지로 턱을 두드리기',
    tips: 'Tap chin twice with index finger',
    tips_ko: '검지로 턱을 두 번 두드리세요',
  }),
  makeSign('sibling', '형제자매', 'Siblings', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .2, leftHandForward: .2 },
    description: 'Two index fingers side by side, move apart',
    description_ko: '양쪽 검지를 나란히 세우고 벌리기',
    tips: 'Fingers start together then separate',
    tips_ko: '검지를 붙였다가 양옆으로 벌리세요',
  }),
  makeSign('grandparents', '할머니/할아버지', 'Grandparents', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .7, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Open hand arcs over head (represents age/wisdom)',
    description_ko: '편 손을 머리 위에서 아치형으로',
    tips: 'Arc hand from front of head to back',
    tips_ko: '머리 앞에서 뒤로 아치를 그리세요',
  }),
  makeSign('older_sister', '언니/누나', 'Older Sister', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_CHEST,
    refHandPosition: { rightHandHeight: .4, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Index finger near chin, then point upward',
    description_ko: '검지를 턱 근처에 두고 위로 가리키기',
    tips: 'Female reference + "older" upward motion',
    tips_ko: '여성을 가리킨 후 위쪽 방향으로 움직이세요',
  }),
  makeSign('older_brother', '오빠/형', 'Older Brother', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Index finger near forehead, then point upward',
    description_ko: '검지를 이마 근처에 두고 위로 가리키기',
    tips: 'Male reference + "older" upward motion',
    tips_ko: '남성을 가리킨 후 위쪽 방향으로 움직이세요',
  }),
]

// ============================================================
// UNIT 7: 일상 동사 (Daily Verbs) — 5 signs
// ============================================================
const unit7 = [
  makeSign('eat', '먹다', 'Eat', 'daily', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Bring fingertips to mouth repeatedly',
    description_ko: '손끝을 입으로 반복해서 가져가기',
    tips: 'Like putting food in your mouth',
    tips_ko: '음식을 입에 넣듯이 반복하세요',
  }),
  makeSign('drink', '마시다', 'Drink', 'daily', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_HIGH,
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .15, leftHandForward: 0 },
    description: 'Cup hand near mouth, tilt upward',
    description_ko: '손을 컵 모양으로 입 근처에서 기울이기',
    tips: 'Mime drinking from a cup',
    tips_ko: '컵으로 마시는 동작을 하세요',
  }),
  makeSign('go', '가다', 'Go', 'daily', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .3, leftHandForward: 0 },
    description: 'Index finger points forward and moves away',
    description_ko: '검지를 앞으로 가리키며 멀어지게',
    tips: 'Pointing motion moving away from body',
    tips_ko: '몸에서 멀어지는 방향으로 가리키세요',
  }),
  makeSign('come', '오다', 'Come', 'daily', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .15, leftHandForward: 0 },
    description: 'Index finger beckons toward self',
    description_ko: '검지를 자신 쪽으로 구부려 부르기',
    tips: 'Curl finger toward yourself',
    tips_ko: '검지를 자신 쪽으로 구부리세요',
  }),
  makeSign('do', '하다', 'Do', 'daily', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .0, leftHandHeight: .0, rightHandForward: .2, leftHandForward: .2 },
    description: 'Both fists move forward and back alternately',
    description_ko: '양 주먹을 번갈아 앞뒤로 움직이기',
    tips: 'Alternating back-and-forth motion',
    tips_ko: '주먹을 번갈아 앞뒤로 움직이세요',
  }),
]

// ============================================================
// UNIT 8: 기타 / 시나리오 (Etc / Scenarios) — 7 signs
// 게임/대화 모드용 시나리오 표현. 일부는 다른 단원에서 참조.
// ============================================================
const findSign = (id) => [...unit1, ...unit2, ...unit3, ...unit4, ...unit6, ...unit7].find(s => s.id === id)

const unit8 = [
  findSign('nicetomeet'),                      // 1. 만나서 반갑습니다 (alias from Unit 1)
  makeSign('age_twenty', '20살입니다', "I'm 20 Years Old", 'etc', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .2, leftHandHeight: -.3, rightHandForward: .15, leftHandForward: 0 },
    description: 'Sign "20" + "age" combined',
    description_ko: '"20" 수어와 "나이"를 연결해서 표현',
    tips: 'Number 20 first, then the age sign',
    tips_ko: '숫자 20을 먼저 표현하고 나이 수어를 이어서 하세요',
  }),
  findSign('help'),                            // 3. 도와주세요 (alias from Unit 2)
  findSign('sorry'),                           // 4. 죄송합니다 (alias from Unit 1)
  makeSign('bathroom_where', '화장실이 어딘가요?', 'Where Is the Bathroom?', 'etc', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .2, leftHandHeight: .1, rightHandForward: .25, leftHandForward: .15 },
    description: 'Sign "bathroom", then point with questioning expression',
    description_ko: '"화장실" 수어 후 손바닥을 펴 묻는 표정',
    tips: 'Bathroom sign + raised eyebrows for question',
    tips_ko: '화장실 수어 후 의문 표정을 지으세요',
  }),
  makeSign('feeling_today', '오늘 기분 어때?', 'How Do You Feel Today?', 'etc', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT,
    refHandPosition: { rightHandHeight: .3, leftHandHeight: -.3, rightHandForward: .2, leftHandForward: 0 },
    description: 'Sign "today" + "feeling", end with questioning gesture',
    description_ko: '"오늘"과 "기분" 수어를 이어서 하고 묻는 동작으로 마무리',
    tips: 'Today + feeling + question expression',
    tips_ko: '오늘 + 기분 수어 후 묻는 표정으로 마무리하세요',
  }),
  findSign('eaten_yet'),                       // 7. 식사 하셨어요? (alias from Unit 1)
].filter(Boolean)

// ============================================================
// EXPORTS
// ============================================================
export const UNITS = [
  {
    id: 'fingerspelling',
    titleEn: 'Korean Fingerspelling',
    titleKo: '한글 자모 (지문자)',
    descEn: 'Learn KSL consonants — the foundation of fingerspelling',
    descKo: '수어 입문의 기초, 자음 지문자 익히기',
    signs: unit0,
  },
  {
    id: 'greetings',
    titleEn: 'Greetings',
    titleKo: '인사',
    descEn: 'Basic greetings and politeness',
    descKo: '기본 인사 표현',
    signs: unit1,
  },
  {
    id: 'responses',
    titleEn: 'Basic Responses',
    titleKo: '기본 응답',
    descEn: 'Yes, no, and everyday replies',
    descKo: '네, 아니요 등 일상 응답',
    signs: unit2,
  },
  {
    id: 'intro',
    titleEn: 'Self Introduction',
    titleKo: '자기소개',
    descEn: 'Introduce yourself in KSL',
    descKo: '수어로 자기소개하기',
    signs: unit3,
  },
  {
    id: 'emotions',
    titleEn: 'Emotions',
    titleKo: '감정',
    descEn: 'Express your feelings',
    descKo: '감정을 표현하기',
    signs: unit4,
  },
  {
    id: 'numbers',
    titleEn: 'Numbers 1-10',
    titleKo: '숫자 1-10',
    descEn: 'Count in KSL',
    descKo: '수어로 숫자 세기',
    signs: unit5,
  },
  {
    id: 'family',
    titleEn: 'Family',
    titleKo: '가족',
    descEn: 'Family members',
    descKo: '가족 관련 표현',
    signs: unit6,
  },
  {
    id: 'daily',
    titleEn: 'Daily Verbs',
    titleKo: '일상 동사',
    descEn: 'Common action words',
    descKo: '일상 동작 표현',
    signs: unit7,
  },
  {
    id: 'etc',
    titleEn: 'Scenarios',
    titleKo: '기타 (상황별 표현)',
    descEn: 'Practical phrases for everyday situations',
    descKo: '실생활 상황별 표현 모음',
    signs: unit8,
  },
]

// Dedupe: same sign object can appear in multiple units (alias).
// ALL_SIGNS keeps unique by id so getSign() and TOTAL_SIGNS reflect distinct signs.
export const ALL_SIGNS = (() => {
  const seen = new Set()
  const result = []
  for (const u of UNITS) {
    for (const s of u.signs) {
      if (!seen.has(s.id)) {
        seen.add(s.id)
        result.push(s)
      }
    }
  }
  return result
})()

export function getUnit(unitId) {
  return UNITS.find((u) => u.id === unitId) || UNITS[0]
}

export function getSign(signId) {
  return ALL_SIGNS.find((s) => s.id === signId)
}

export const TOTAL_SIGNS = ALL_SIGNS.length
