import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, ChevronRight, X, Check, Trophy, RotateCcw } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D, ProgressBar, Badge } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import { getSignVideo, preloadRecordedSigns } from '@/services/signStorage'
import { getSign } from '@/data/signDatabase'
import { QUIZ_BANK, buildOptions } from '@/data/quizQuestions'
import useLanguage from '@/stores/useLanguage'
import useProgress from '@/hooks/useProgress'
import useCombo, { comboMultiplier } from '@/stores/useCombo'

const PHASE = { INTRO: 'intro', PLAY: 'play', FEEDBACK: 'feedback', SUMMARY: 'summary' }
const ROUNDS_PER_SESSION = 5
const BASE_XP = 20
const BASE_STARS = 5
const STREAK_BONUS_STARS = 10

function pickNextRound(usedIds = new Set()) {
  const pool = QUIZ_BANK.filter((q) => !usedIds.has(q.signId))
  const candidates = pool.length > 0 ? pool : QUIZ_BANK
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export default function QuizMode() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { addXp, addStars, bumpMission } = useProgress()
  const comboCount = useCombo((s) => s.combo)
  const comboIncrement = useCombo((s) => s.increment)
  const comboBreak = useCombo((s) => s.break)

  const [phase, setPhase] = useState(PHASE.INTRO)
  const [roundNum, setRoundNum] = useState(0)
  const [usedIds] = useState(() => new Set())
  const [entry, setEntry] = useState(null)
  const [options, setOptions] = useState([])
  const [correctText, setCorrectText] = useState('')
  const [videoUrl, setVideoUrl] = useState(null)
  const [selected, setSelected] = useState(null) // index
  const [history, setHistory] = useState([]) // { signId, correct: bool, xp, stars }
  const [correctStreak, setCorrectStreak] = useState(0)

  const videoRef = useRef(null)

  // Preload Supabase video catalog
  useEffect(() => { preloadRecordedSigns() }, [])

  const startRound = async (n = 1) => {
    const next = pickNextRound(usedIds)
    usedIds.add(next.signId)
    const { correct, options: opts } = buildOptions(next, lang, 'easy')
    setEntry(next)
    setCorrectText(correct)
    setOptions(opts)
    setSelected(null)
    setRoundNum(n)
    setPhase(PHASE.PLAY)
    try {
      const url = await getSignVideo(next.signId)
      setVideoUrl(url || null)
    } catch {
      setVideoUrl(null)
    }
  }

  const startSession = () => {
    usedIds.clear()
    setHistory([])
    setCorrectStreak(0)
    startRound(1)
  }

  const handleSelect = async (idx) => {
    if (selected !== null) return
    setSelected(idx)
    const chosen = options[idx]
    const isCorrect = chosen === correctText

    let xpGranted = 0
    let starsGranted = 0
    let bonusStars = 0
    let newStreak = correctStreak

    if (isCorrect) {
      comboIncrement()
      newStreak = correctStreak + 1
      const mult = comboMultiplier(comboCount + 1)
      const xpAmount = Math.round(BASE_XP * mult)
      try {
        const { granted } = await addXp(xpAmount)
        xpGranted = granted ?? xpAmount
        await addStars(BASE_STARS)
        starsGranted = BASE_STARS
        if (newStreak > 0 && newStreak % 3 === 0) {
          await addStars(STREAK_BONUS_STARS)
          bonusStars = STREAK_BONUS_STARS
        }
      } catch (e) {
        console.warn('[Quiz] reward failed:', e.message)
      }
    } else {
      comboBreak()
      newStreak = 0
    }

    setCorrectStreak(newStreak)
    setHistory((h) => [...h, {
      signId: entry.signId,
      correct: isCorrect,
      xp: xpGranted,
      stars: starsGranted + bonusStars,
      bonus: bonusStars > 0,
    }])
    setPhase(PHASE.FEEDBACK)
  }

  const advance = async () => {
    if (roundNum >= ROUNDS_PER_SESSION) {
      try { await bumpMission('quiz_done') } catch (e) { /* ignore */ }
      setPhase(PHASE.SUMMARY)
    } else {
      startRound(roundNum + 1)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-[fadeIn_0.5s_ease]">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/missions')} className="cursor-pointer hover:scale-110 transition-transform">
          <ArrowLeft size={22} strokeWidth={2.5} color={COLORS.gray400} />
        </button>
        <div className="flex items-center gap-2">
          <Brain size={18} color={COLORS.purple} strokeWidth={2.5} />
          <h1 className="text-lg font-black" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '수어 퀴즈 — 질문 맞히기' : 'Sign Quiz — Match the Question'}
          </h1>
        </div>
        {phase === PHASE.PLAY || phase === PHASE.FEEDBACK ? (
          <span className="ml-auto text-xs font-extrabold" style={{ color: COLORS.gray500 }}>
            {roundNum}/{ROUNDS_PER_SESSION}
          </span>
        ) : null}
      </div>

      {phase !== PHASE.INTRO && phase !== PHASE.SUMMARY && (
        <ProgressBar progress={(roundNum / ROUNDS_PER_SESSION) * 100} color={COLORS.purple} height="h-2" />
      )}

      {phase === PHASE.INTRO && <IntroScreen lang={lang} onStart={startSession} />}

      {(phase === PHASE.PLAY || phase === PHASE.FEEDBACK) && entry && (
        <Card3D color={COLORS.gray200} padding="p-5">
          {/* Sign video */}
          <p className="text-xs font-extrabold uppercase tracking-wider text-center mb-2"
            style={{ color: COLORS.gray400 }}>
            {lang === 'ko' ? '이 수어는 어떤 질문에 대한 답일까요?' : 'Which question does this sign answer?'}
          </p>

          <div className="rounded-2xl overflow-hidden mx-auto mb-4"
            style={{ maxWidth: 360, border: `2px solid ${COLORS.purple}30`, background: COLORS.gray100 }}>
            {videoUrl ? (
              <video
                ref={videoRef}
                key={entry.signId}
                src={videoUrl}
                className="w-full"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center text-center p-4">
                <p className="text-5xl font-black" style={{ color: COLORS.purple }}>
                  {getSign(entry.signId)?.name_ko ?? entry.signId}
                </p>
                <p className="text-xs font-bold mt-2" style={{ color: COLORS.gray400 }}>
                  {lang === 'ko' ? '(참고 영상 미녹화)' : '(reference video not recorded)'}
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 gap-2.5">
            {options.map((opt, i) => {
              const isChosen = selected === i
              const isCorrectOpt = opt === correctText
              let bg = 'white'
              let border = COLORS.gray200
              let textColor = COLORS.gray800

              if (phase === PHASE.FEEDBACK) {
                if (isCorrectOpt) {
                  bg = `${COLORS.green}15`
                  border = COLORS.green
                  textColor = COLORS.greenDark
                } else if (isChosen) {
                  bg = `${COLORS.red}15`
                  border = COLORS.red
                  textColor = COLORS.red
                }
              } else if (isChosen) {
                bg = `${COLORS.purple}15`
                border = COLORS.purple
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={phase === PHASE.FEEDBACK}
                  className="flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition-all"
                  style={{
                    background: bg,
                    border: `2px solid ${border}`,
                    cursor: phase === PHASE.FEEDBACK ? 'default' : 'pointer',
                    transform: phase === PHASE.PLAY && isChosen ? 'scale(0.99)' : undefined,
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0"
                    style={{ background: border, color: 'white' }}
                  >
                    {phase === PHASE.FEEDBACK && isCorrectOpt
                      ? <Check size={14} strokeWidth={3} />
                      : phase === PHASE.FEEDBACK && isChosen && !isCorrectOpt
                        ? <X size={14} strokeWidth={3} />
                        : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-extrabold flex-1" style={{ color: textColor }}>{opt}</span>
                </button>
              )
            })}
          </div>

          {phase === PHASE.FEEDBACK && (
            <FeedbackFooter
              lang={lang}
              entry={entry}
              last={history[history.length - 1]}
              onAdvance={advance}
              isLastRound={roundNum >= ROUNDS_PER_SESSION}
            />
          )}
        </Card3D>
      )}

      {phase === PHASE.SUMMARY && (
        <SummaryScreen
          lang={lang}
          history={history}
          onRestart={startSession}
          onExit={() => navigate('/missions')}
        />
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

function IntroScreen({ lang, onStart }) {
  return (
    <Card3D color={COLORS.purple} padding="p-6">
      <div className="flex items-center gap-4">
        <HandMascot size={64} mood="excited" />
        <div className="flex-1">
          <h2 className="text-xl font-black" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '수어를 보고 질문을 골라보세요!' : 'Watch the sign and pick the right question'}
          </h2>
          <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray500 }}>
            {lang === 'ko'
              ? '단어를 외우는 게 아니라, 그 단어가 어떤 상황에서 쓰이는지 익히는 모드예요.'
              : 'Less memorization — more context. Learn how each sign is used in real questions.'}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-1.5 text-xs font-bold" style={{ color: COLORS.gray600 }}>
        <li>• {lang === 'ko' ? `한 세션당 ${ROUNDS_PER_SESSION}문제` : `${ROUNDS_PER_SESSION} questions per session`}</li>
        <li>• {lang === 'ko' ? `정답 시 +${BASE_XP} XP, +${BASE_STARS} ★` : `+${BASE_XP} XP and +${BASE_STARS} ★ per correct answer`}</li>
        <li>• {lang === 'ko' ? `3연속 정답 시 보너스 +${STREAK_BONUS_STARS} ★` : `3-in-a-row bonus: +${STREAK_BONUS_STARS} ★`}</li>
        <li>• {lang === 'ko' ? '하트는 차감되지 않아요' : 'No hearts are consumed'}</li>
      </ul>

      <div className="mt-5">
        <Button3D
          fullWidth
          size="lg"
          color={COLORS.purple}
          darkColor={COLORS.purpleDark}
          icon={<Brain size={18} />}
          onClick={onStart}
        >
          {lang === 'ko' ? '퀴즈 시작' : 'Start Quiz'}
        </Button3D>
      </div>
    </Card3D>
  )
}

function FeedbackFooter({ lang, entry, last, onAdvance, isLastRound }) {
  if (!last) return null
  const isCorrect = last.correct
  const categoryLabel = {
    who: lang === 'ko' ? '누구 (Who)' : 'Who',
    what: lang === 'ko' ? '무엇 (What)' : 'What',
    where: lang === 'ko' ? '어디서 (Where)' : 'Where',
    when: lang === 'ko' ? '언제 (When)' : 'When',
    how_feel: lang === 'ko' ? '기분/상태 (How feel)' : 'How (feel)',
    how_many: lang === 'ko' ? '얼마/몇 (How many)' : 'How many',
  }[entry.category] || entry.category

  return (
    <div
      className="mt-4 rounded-2xl p-4 animate-[fadeIn_0.3s_ease]"
      style={{
        background: isCorrect ? `${COLORS.green}10` : `${COLORS.red}10`,
        border: `2px solid ${isCorrect ? COLORS.green : COLORS.red}`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black"
            style={{ color: isCorrect ? COLORS.greenDark : COLORS.red }}>
            {isCorrect
              ? (lang === 'ko' ? '🎉 정답!' : '🎉 Correct!')
              : (lang === 'ko' ? '아쉬워요!' : 'Not quite!')}
          </p>
          <p className="text-xs font-bold mt-1" style={{ color: COLORS.gray600 }}>
            {lang === 'ko' ? '이 수어는 ' : 'This sign answers '}
            <span className="font-black" style={{ color: COLORS.purple }}>{categoryLabel}</span>
            {lang === 'ko' ? ' 질문에 대한 답이에요.' : ' questions.'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {isCorrect && <Badge color={COLORS.yellow}>+{last.xp} XP</Badge>}
          {isCorrect && last.stars > 0 && <Badge color={COLORS.yellow}>+{last.stars} ★</Badge>}
          {last.bonus && (
            <Badge color={COLORS.purple}>
              {lang === 'ko' ? '3연속!' : '3 in a row!'}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-3">
        <Button3D
          fullWidth
          size="sm"
          color={COLORS.purple}
          darkColor={COLORS.purpleDark}
          icon={<ChevronRight size={16} />}
          onClick={onAdvance}
        >
          {isLastRound
            ? (lang === 'ko' ? '결과 보기' : 'See results')
            : (lang === 'ko' ? '다음 문제' : 'Next question')}
        </Button3D>
      </div>
    </div>
  )
}

function SummaryScreen({ lang, history, onRestart, onExit }) {
  const correctCount = history.filter((h) => h.correct).length
  const totalXp = history.reduce((s, h) => s + (h.xp || 0), 0)
  const totalStars = history.reduce((s, h) => s + (h.stars || 0), 0)
  const isPerfect = correctCount === history.length

  return (
    <Card3D color={isPerfect ? COLORS.green : COLORS.purple} padding="p-6" className="text-center">
      <div className="flex justify-center mb-2">
        <HandMascot size={72} mood={isPerfect ? 'excited' : correctCount > 0 ? 'neutral' : 'sad'} />
      </div>
      <h2 className="text-2xl font-black" style={{ color: COLORS.gray800 }}>
        {isPerfect
          ? (lang === 'ko' ? '🏆 완벽!' : '🏆 Perfect!')
          : (lang === 'ko' ? '수고했어요!' : 'Nice work!')}
      </h2>
      <p className="text-4xl font-black mt-3" style={{ color: COLORS.purple }}>
        {correctCount} <span className="text-base font-bold" style={{ color: COLORS.gray400 }}>/ {history.length}</span>
      </p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="rounded-2xl p-3" style={{ background: `${COLORS.yellow}15` }}>
          <p className="text-xl font-black" style={{ color: COLORS.yellow }}>+{totalXp}</p>
          <p className="text-[10px] font-bold mt-0.5" style={{ color: COLORS.gray500 }}>
            {lang === 'ko' ? '획득 XP' : 'XP earned'}
          </p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: `${COLORS.yellow}15` }}>
          <p className="text-xl font-black" style={{ color: COLORS.yellow }}>+{totalStars}</p>
          <p className="text-[10px] font-bold mt-0.5" style={{ color: COLORS.gray500 }}>
            {lang === 'ko' ? '획득 스타' : 'Stars earned'}
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 justify-center">
        <ButtonOutline color={COLORS.gray400} icon={<Trophy size={14} />} onClick={onExit}>
          {lang === 'ko' ? '미션으로' : 'Back to missions'}
        </ButtonOutline>
        <Button3D
          color={COLORS.purple}
          darkColor={COLORS.purpleDark}
          icon={<RotateCcw size={16} />}
          onClick={onRestart}
        >
          {lang === 'ko' ? '한 번 더' : 'Play again'}
        </Button3D>
      </div>
    </Card3D>
  )
}
