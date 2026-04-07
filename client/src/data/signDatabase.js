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

// 국립국어원 한국수어사전 비디오 URL 매핑
// https://sldict.korean.go.kr 에서 각 단어의 영상 URL
// origin_no 기반으로 사전 페이지 링크 생성
const DICT_BASE = 'https://sldict.korean.go.kr/front/sign/signContentsView.do?origin_no='

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
    // 참고 영상 / 사전 링크
    videoUrl: opts.videoUrl || null,
    dictUrl: opts.dictNo ? DICT_BASE + opts.dictNo : null,
    description: opts.description || '',
    description_ko: opts.description_ko || '',
    tips: opts.tips || '',
    tips_ko: opts.tips_ko || '',
  }
}

// ============================================================
// UNIT 1: 인사 (Greetings) — 6 signs
// ============================================================
const unit1 = [
  makeSign('hello', '안녕하세요', 'Hello', 'greetings', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT, dictNo: '2971',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151221/231645/MOV000244234_320X240.mp4',
    refHandPosition: { rightHandHeight: .3, leftHandHeight: -.5, rightHandForward: .15, leftHandForward: 0 },
    description: 'Open palm facing outward, bow head slightly',
    description_ko: '손바닥을 펴서 앞으로 향하게 하고 가볍게 인사',
    tips: 'Keep all fingers together and straight',
    tips_ko: '손가락을 모두 모아 펴세요',
  }),
  makeSign('thankyou', '감사합니다', 'Thank You', 'greetings', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH, dictNo: '267',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191022/629975/MOV000235161_320X240.mp4',
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .2, leftHandForward: 0 },
    description: 'Place flat hand on forehead, bring forward and down',
    description_ko: '편 손을 이마에 대고 앞으로 내려서 인사',
    tips: 'Start at forehead, smooth arc downward',
    tips_ko: '이마에서 시작해 부드럽게 내리세요',
  }),
  makeSign('sorry', '죄송합니다', 'Sorry', 'greetings', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_CHEST, dictNo: '4747',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20200825/735600/MOV000248556_320X240.mp4',
    refHandPosition: { rightHandHeight: .8, leftHandHeight: -.3, rightHandForward: .2, leftHandForward: 0 },
    description: 'Make a fist, rub in circle on chest',
    description_ko: '주먹을 쥐고 가슴 위에서 원을 그리며 돌리기',
    tips: 'Gentle circular motion',
    tips_ko: '부드럽게 원을 그리세요',
  }),
  makeSign('nicetomeet', '만나서 반갑습니다', 'Nice to Meet You', 'greetings', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT, dictNo: '4062',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191014/627281/MOV000243250_320X240.mp4',
    refHandPosition: { rightHandHeight: .2, leftHandHeight: .2, rightHandForward: .3, leftHandForward: .3 },
    description: 'Both palms open, bring together in front',
    description_ko: '양손을 펴서 앞에서 모으며 인사',
    tips: 'Both hands move toward each other',
    tips_ko: '양손을 앞에서 부드럽게 모으세요',
  }),
  makeSign('goodbye', '안녕히 가세요', 'Goodbye', 'greetings', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT, dictNo: '2974',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151222/232540/MOV000244638_320X240.mp4',
    refHandPosition: { rightHandHeight: .4, leftHandHeight: -.5, rightHandForward: .2, leftHandForward: 0 },
    description: 'Open hand wave side to side',
    description_ko: '손을 펴서 좌우로 흔들며 인사',
    tips: 'Wave from wrist, not whole arm',
    tips_ko: '팔이 아니라 손목에서 흔드세요',
  }),
  makeSign('excuse', '실례합니다', 'Excuse Me', 'greetings', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST, dictNo: '5791',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151230/237417/MOV000246868_320X240.mp4',
    refHandPosition: { rightHandHeight: .5, leftHandHeight: -.3, rightHandForward: .15, leftHandForward: 0 },
    description: 'Flat hand touches chin then extends forward',
    description_ko: '편 손을 턱에 대고 앞으로 내밀기',
    tips: 'Light touch on chin, then extend outward',
    tips_ko: '턱을 가볍게 터치한 후 앞으로 내미세요',
  }),
]

// ============================================================
// UNIT 2: 기본 응답 (Basic Responses) — 6 signs
// ============================================================
const unit2 = [
  makeSign('yes', '네', 'Yes', 'responses', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_NEUTRAL, dictNo: '2140',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151205/222567/MOV000240139_320X240.mp4',
    refHandPosition: { rightHandHeight: 0, leftHandHeight: -.4, rightHandForward: .1, leftHandForward: 0 },
    description: 'Fist nods forward from wrist',
    description_ko: '주먹을 쥐고 손목에서 앞으로 끄덕이기',
    tips: 'Like your fist is nodding',
    tips_ko: '주먹이 고개를 끄덕이듯 움직이세요',
  }),
  makeSign('no', '아니요', 'No', 'responses', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_NEUTRAL, dictNo: '1478',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151122/214761/MOV000236610_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .2, leftHandForward: 0 },
    description: 'Open hand waves side to side in front of face',
    description_ko: '손을 펴서 얼굴 앞에서 좌우로 흔들기',
    tips: 'Palm faces forward',
    tips_ko: '손바닥이 앞을 향하게 하세요',
  }),
  makeSign('okay', '괜찮아요', "It's Okay", 'responses', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST, dictNo: '9466',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191022/630119/MOV000249438_320X240.mp4',
    refHandPosition: { rightHandHeight: .3, leftHandHeight: -.4, rightHandForward: .15, leftHandForward: 0 },
    description: 'Open hand pats chest gently',
    description_ko: '편 손으로 가슴을 가볍게 쓸어내리기',
    tips: 'Gentle downward stroke on chest',
    tips_ko: '가슴을 부드럽게 쓸어내리세요',
  }),
  makeSign('dontknow', '모르겠어요', "I Don't Know", 'responses', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH, dictNo: '11931',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191028/632088/MOV000251527_320X240.mp4',
    refHandPosition: { rightHandHeight: .5, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Open hand touches forehead, then turns palm up',
    description_ko: '편 손으로 이마를 터치한 후 손바닥을 위로',
    tips: 'Shrug-like gesture after touching forehead',
    tips_ko: '이마를 터치한 후 어깨를 으쓱하듯이',
  }),
  makeSign('help', '도와주세요', 'Help Me', 'responses', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_FRONT, dictNo: '6773',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20220801/1004910/MOV000359742_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .3, leftHandForward: .3 },
    description: 'Fist on open palm, push upward together',
    description_ko: '주먹을 편 손바닥 위에 놓고 함께 올리기',
    tips: 'Left palm flat, right fist on top, push up',
    tips_ko: '왼손을 펴고 오른쪽 주먹을 올려서 함께 위로',
  }),
  makeSign('wait', '기다려주세요', 'Please Wait', 'responses', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT, dictNo: '7336',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191016/628094/MOV000249602_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .25, leftHandForward: 0 },
    description: 'Palm facing down, pat air gently downward',
    description_ko: '손바닥을 아래로 향하게 하고 공기를 누르듯 아래로',
    tips: 'Calm, slow pushing motion',
    tips_ko: '차분하게 천천히 누르세요',
  }),
]

// ============================================================
// UNIT 3: 자기소개 (Self Introduction) — 6 signs
// ============================================================
const unit3 = [
  makeSign('me', '나/저', 'I / Me', 'intro', {
    landmarks: INDEX_UP, poseLandmarks: POSE_CHEST, dictNo: '4710',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20221014/1040361/MOV000360760_320X240.mp4',
    refHandPosition: { rightHandHeight: .3, leftHandHeight: -.4, rightHandForward: 0, leftHandForward: 0 },
    description: 'Point index finger to your own chest',
    description_ko: '검지로 자신의 가슴을 가리키기',
    tips: 'Clear pointing motion to yourself',
    tips_ko: '자신을 명확하게 가리키세요',
  }),
  makeSign('you', '당신', 'You', 'intro', {
    landmarks: INDEX_UP, poseLandmarks: POSE_FRONT, dictNo: '11845',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20200824/735063/MOV000251321_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .3, leftHandForward: 0 },
    description: 'Point index finger forward toward the other person',
    description_ko: '검지로 상대방을 가리키기',
    tips: 'Point gently, not aggressively',
    tips_ko: '부드럽게 가리키세요',
  }),
  makeSign('name', '이름', 'Name', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_FRONT, dictNo: '7059',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191015/627715/MOV000256668_320X240.mp4',
    refHandPosition: { rightHandHeight: .2, leftHandHeight: .2, rightHandForward: .2, leftHandForward: .2 },
    description: 'Two index fingers cross in an X shape',
    description_ko: '양 검지를 X자로 교차하기',
    tips: 'Cross index fingers in front of chest',
    tips_ko: '가슴 앞에서 검지를 교차하세요',
  }),
  makeSign('student', '학생', 'Student', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH, dictNo: '1362',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191001/623672/MOV000236222_320X240.mp4',
    refHandPosition: { rightHandHeight: .5, leftHandHeight: .3, rightHandForward: .15, leftHandForward: .15 },
    description: 'Mime opening a book, then point to self',
    description_ko: '책을 펴는 동작 후 자신을 가리키기',
    tips: 'Open palms like book pages, then point to chest',
    tips_ko: '책 펴듯 양손을 펴고, 가슴을 가리키세요',
  }),
  makeSign('school', '학교', 'School', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT, dictNo: '1352',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191001/623672/MOV000236222_320X240.mp4',
    refHandPosition: { rightHandHeight: .2, leftHandHeight: .2, rightHandForward: .2, leftHandForward: .2 },
    description: 'Both palms open and close like a book',
    description_ko: '양손을 펴서 책처럼 열고 닫기',
    tips: 'Hands face each other, open and close',
    tips_ko: '양손을 마주보게 하고 열고 닫으세요',
  }),
  makeSign('friend', '친구', 'Friend', 'intro', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_FRONT, dictNo: '7878',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20160108/242737/MOV000255910_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .25, leftHandForward: .25 },
    description: 'Hook index fingers together',
    description_ko: '양쪽 검지를 서로 걸기',
    tips: 'Interlock curved index fingers',
    tips_ko: '구부린 검지를 서로 걸어주세요',
  }),
]

// ============================================================
// UNIT 4: 감정 (Emotions) — 6 signs
// ============================================================
const unit4 = [
  makeSign('good', '좋아요', 'Good / Like', 'emotions', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_FRONT, dictNo: '9078',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191022/629987/MOV000259382_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .2, leftHandForward: 0 },
    description: 'Thumbs up',
    description_ko: '엄지를 위로 올리기',
    tips: 'Classic thumbs up gesture',
    tips_ko: '엄지를 확실하게 올리세요',
  }),
  makeSign('bad', '싫어요', 'Bad / Dislike', 'emotions', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_FRONT, dictNo: '23960',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191101/633247/MOV000255247_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .2, leftHandForward: 0 },
    description: 'Thumbs down',
    description_ko: '엄지를 아래로 내리기',
    tips: 'Thumbs down, slight wrist rotation',
    tips_ko: '엄지를 확실하게 내리세요',
  }),
  makeSign('happy', '행복해요', 'Happy', 'emotions', {
    type: 'dynamic', landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST, dictNo: '10223',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191025/630748/MOV000237400_320X240.mp4',
    refHandPosition: { rightHandHeight: .4, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Flat hand circles upward over chest',
    description_ko: '편 손을 가슴 위에서 위로 원을 그리기',
    tips: 'Upward circular motion shows positive emotion',
    tips_ko: '위쪽 방향으로 원을 그리세요',
  }),
  makeSign('sad', '슬퍼요', 'Sad', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH, dictNo: '7240',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191016/628057/MOV000256235_320X240.mp4',
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Open hands slide down face',
    description_ko: '편 손을 얼굴에서 아래로 쓸어내리기',
    tips: 'Like tears falling down face',
    tips_ko: '눈물이 흐르듯 얼굴을 쓸어내리세요',
  }),
  makeSign('angry', '화나요', 'Angry', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_HIGH, dictNo: '1086',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20190918/615455/MOV000237775_320X240.mp4',
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .15, leftHandForward: 0 },
    description: 'Claw hand pulls away from face',
    description_ko: '손을 구부려서 얼굴 앞에서 바깥으로 당기기',
    tips: 'Tense, pulling motion from face outward',
    tips_ko: '얼굴에서 바깥으로 강하게 당기세요',
  }),
  makeSign('tired', '피곤해요', 'Tired', 'emotions', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_CHEST, dictNo: '12438',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20200819/731444/MOV000250100_320X240.mp4',
    refHandPosition: { rightHandHeight: .3, leftHandHeight: .3, rightHandForward: .05, leftHandForward: .05 },
    description: 'Both hands on chest, drop down',
    description_ko: '양손을 가슴에 대고 아래로 떨어뜨리기',
    tips: 'Hands start on upper chest, drop as body droops',
    tips_ko: '가슴 위에서 힘없이 아래로 떨어뜨리세요',
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
// UNIT 6: 가족 (Family) — 5 signs
// ============================================================
const unit6 = [
  makeSign('family', '가족', 'Family', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_FRONT, dictNo: '106',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151116/210920/MOV000234852_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .2, leftHandForward: .2 },
    description: 'Both hands circle outward forming a group',
    description_ko: '양손을 바깥으로 원을 그리며 모으기',
    tips: 'Circle motion represents gathering',
    tips_ko: '가족이 모이는 느낌으로 원을 그리세요',
  }),
  makeSign('dad', '아빠', 'Dad', 'family', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_HIGH, dictNo: '2519',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151204/221671/MOV000239745_320X240.mp4',
    refHandPosition: { rightHandHeight: .7, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Index finger taps forehead',
    description_ko: '검지로 이마를 두드리기',
    tips: 'Tap forehead twice with index finger',
    tips_ko: '검지로 이마를 두 번 두드리세요',
  }),
  makeSign('mom', '엄마', 'Mom', 'family', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_CHEST, dictNo: '3149',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20151130/219371/MOV000238697_320X240.mp4',
    refHandPosition: { rightHandHeight: .4, leftHandHeight: -.3, rightHandForward: .05, leftHandForward: 0 },
    description: 'Index finger taps chin',
    description_ko: '검지로 턱을 두드리기',
    tips: 'Tap chin twice with index finger',
    tips_ko: '검지로 턱을 두 번 두드리세요',
  }),
  makeSign('sibling', '형제자매', 'Siblings', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: INDEX_UP, poseLandmarks: POSE_FRONT, dictNo: '12505',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191029/632428/MOV000237648_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: .1, rightHandForward: .2, leftHandForward: .2 },
    description: 'Two index fingers side by side, move apart',
    description_ko: '양쪽 검지를 나란히 세우고 벌리기',
    tips: 'Fingers start together then separate',
    tips_ko: '검지를 붙였다가 양옆으로 벌리세요',
  }),
  makeSign('grandparents', '할머니/할아버지', 'Grandparents', 'family', {
    type: 'dynamic', difficulty: 2, landmarks: OPEN_HAND, poseLandmarks: POSE_HIGH, dictNo: '10284',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191025/630754/MOV000236360_320X240.mp4',
    refHandPosition: { rightHandHeight: .7, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Open hand arcs over head (represents age/wisdom)',
    description_ko: '편 손을 머리 위에서 아치형으로',
    tips: 'Arc hand from front of head to back',
    tips_ko: '머리 앞에서 뒤로 아치를 그리세요',
  }),
]

// ============================================================
// UNIT 7: 일상 동사 (Daily Verbs) — 5 signs
// ============================================================
const unit7 = [
  makeSign('eat', '먹다', 'Eat', 'daily', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_HIGH, dictNo: '10419',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191025/630761/MOV000250824_320X240.mp4',
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .1, leftHandForward: 0 },
    description: 'Bring fingertips to mouth repeatedly',
    description_ko: '손끝을 입으로 반복해서 가져가기',
    tips: 'Like putting food in your mouth',
    tips_ko: '음식을 입에 넣듯이 반복하세요',
  }),
  makeSign('drink', '마시다', 'Drink', 'daily', {
    type: 'dynamic', landmarks: FIST, poseLandmarks: POSE_HIGH, dictNo: '6277',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20200824/734844/MOV000251932_320X240.mp4',
    refHandPosition: { rightHandHeight: .6, leftHandHeight: -.3, rightHandForward: .15, leftHandForward: 0 },
    description: 'Cup hand near mouth, tilt upward',
    description_ko: '손을 컵 모양으로 입 근처에서 기울이기',
    tips: 'Mime drinking from a cup',
    tips_ko: '컵으로 마시는 동작을 하세요',
  }),
  makeSign('go', '가다', 'Go', 'daily', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_FRONT, dictNo: '11796',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191028/632050/MOV000249486_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .3, leftHandForward: 0 },
    description: 'Index finger points forward and moves away',
    description_ko: '검지를 앞으로 가리키며 멀어지게',
    tips: 'Pointing motion moving away from body',
    tips_ko: '몸에서 멀어지는 방향으로 가리키세요',
  }),
  makeSign('come', '오다', 'Come', 'daily', {
    type: 'dynamic', landmarks: INDEX_UP, poseLandmarks: POSE_FRONT, dictNo: '7704',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20191016/628281/MOV000256338_320X240.mp4',
    refHandPosition: { rightHandHeight: .1, leftHandHeight: -.4, rightHandForward: .15, leftHandForward: 0 },
    description: 'Index finger beckons toward self',
    description_ko: '검지를 자신 쪽으로 구부려 부르기',
    tips: 'Curl finger toward yourself',
    tips_ko: '검지를 자신 쪽으로 구부리세요',
  }),
  makeSign('do', '하다', 'Do', 'daily', {
    type: 'dynamic', difficulty: 2, landmarks: FIST, poseLandmarks: POSE_FRONT, dictNo: '12809',
    videoUrl: 'https://sldict.korean.go.kr/multimedia/multimedia_files/convert/20200824/735086/MOV000256132_320X240.mp4',
    refHandPosition: { rightHandHeight: .0, leftHandHeight: .0, rightHandForward: .2, leftHandForward: .2 },
    description: 'Both fists move forward and back alternately',
    description_ko: '양 주먹을 번갈아 앞뒤로 움직이기',
    tips: 'Alternating back-and-forth motion',
    tips_ko: '주먹을 번갈아 앞뒤로 움직이세요',
  }),
]

// ============================================================
// EXPORTS
// ============================================================
export const UNITS = [
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
]

export const ALL_SIGNS = UNITS.flatMap((u) => u.signs)

export function getUnit(unitId) {
  return UNITS.find((u) => u.id === unitId) || UNITS[0]
}

export function getSign(signId) {
  return ALL_SIGNS.find((s) => s.id === signId)
}

export const TOTAL_SIGNS = ALL_SIGNS.length // 44
