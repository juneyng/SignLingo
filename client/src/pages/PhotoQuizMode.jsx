import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, ChevronRight, X, Check, Trophy, RotateCcw } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D, ProgressBar, Badge } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import { getSignVideo, preloadRecordedSigns } from '@/services/signStorage'
import { getSign } from '@/data/signDatabase'
import { PHOTO_QUIZ_BANK, buildPhotoRound, pickRandomPhotoEntry } from '@/data/quizPhotoQuestions'
import useLanguage from '@/stores/useLanguage'
import useProgress from '@/hooks/useProgress'
import useCombo, { comboMultiplier } from '@/stores/useCombo'

const PHASE = { INTRO: 'intro', PLAY: 'play', FEEDBACK: 'feedback', SUMMARY: 'summary' }
const ROUNDS_PER_SESSION = 5
const BASE_XP = 20
const BASE_STARS = 5
const STREAK_BONUS_STARS = 10

export default function PhotoQuizMode() {
  const navigate = useNavigate()
  const { lang } = useLanguage()
  const { addXp, addStars, bumpMission } = useProgress()
  const comboCount = useCombo((s) => s.combo)
  const comboIncrement = useCombo((s) => s.increment)
  const comboBreak = useCombo((s) => s.break)

  const [phase, setPhase] = useState(PHASE.INTRO)
  const [roundNum, setRoundNum] = useState(0)
  const [usedIds] = useState(() => new Set())
  const [round, setRound] = useState(null) // { scene, options, correctSignId, optionVideos }
  const [selected, setSelected] = useState(null) // index
  const [history, setHistory] = useState([])
  const [correctStreak, setCorrectStreak] = useState(0)
  const optionVideoRefs = useRef([])

  useEffect(() => { preloadRecordedSigns() }, [])

  const startRound = async (n = 1) => {
    const entry = pickRandomPhotoEntry(usedIds)
    usedIds.add(entry.id)
    const built = buildPhotoRound(entry)
    // Pre-fetch video URLs for all 4 options
    const videoUrls = await Promise.all(
      built.options.map((id) => getSignVideo(id).catch(() => null))
    )
    setRound({ ...built, videoUrls })
    setSelected(null)
    setRoundNum(n)
    setPhase(PHASE.PLAY)
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
    const chosenSignId = round.options[idx]
    const isCorrect = chosenSignId === round.correctSignId

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
        console.warn('[PhotoQuiz] reward failed:', e.message)
      }
    } else {
      comboBreak()
      newStreak = 0
    }

    setCorrectStreak(newStreak)
    setHistory((h) => [...h, {
      signId: round.correctSignId,
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

  // Stop all option videos when entering feedback to avoid 4 simultaneous playbacks lingering
  useEffect(() => {
    if (phase === PHASE.FEEDBACK) {
      optionVideoRefs.current.forEach((v) => v && v.pause())
    }
  }, [phase])

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-[fadeIn_0.5s_ease]">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/missions')} className="cursor-pointer hover:scale-110 transition-transform">
          <ArrowLeft size={22} strokeWidth={2.5} color={COLORS.gray400} />
        </button>
        <div className="flex items-center gap-2">
          <Camera size={18} color={COLORS.blue} strokeWidth={2.5} />
          <h1 className="text-lg font-black" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '사진 퀴즈 — 수어 고르기' : 'Photo Quiz — Pick the Sign'}
          </h1>
        </div>
        {(phase === PHASE.PLAY || phase === PHASE.FEEDBACK) && (
          <span className="ml-auto text-xs font-extrabold" style={{ color: COLORS.gray500 }}>
            {roundNum}/{ROUNDS_PER_SESSION}
          </span>
        )}
      </div>

      {phase !== PHASE.INTRO && phase !== PHASE.SUMMARY && (
        <ProgressBar progress={(roundNum / ROUNDS_PER_SESSION) * 100} color={COLORS.blue} height="h-2" />
      )}

      {phase === PHASE.INTRO && <IntroScreen lang={lang} onStart={startSession} />}

      {(phase === PHASE.PLAY || phase === PHASE.FEEDBACK) && round && (
        <Card3D color={COLORS.gray200} padding="p-5">
          {/* Scene prompt */}
          <p className="text-xs font-extrabold uppercase tracking-wider text-center mb-2"
            style={{ color: COLORS.gray400 }}>
            {lang === 'ko' ? '이 장면을 어떻게 수어로 할까요?' : 'Which sign matches this scene?'}
          </p>

          <div className="mx-auto rounded-2xl text-center mb-5 py-6 px-4"
            style={{
              maxWidth: 380,
              background: `linear-gradient(135deg, ${COLORS.blue}10, ${COLORS.purple}10)`,
              border: `2px solid ${COLORS.blue}30`,
            }}>
            <div className="text-7xl leading-none mb-2">{round.scene.emoji}</div>
            <p className="text-sm font-black" style={{ color: COLORS.gray800 }}>
              {lang === 'ko' ? round.scene.caption_ko : round.scene.caption_en}
            </p>
          </div>

          {/* 4 option videos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {round.options.map((signId, i) => {
              const isChosen = selected === i
              const isCorrectOpt = signId === round.correctSignId
              const sign = getSign(signId)
              const videoUrl = round.videoUrls[i]

              let borderColor = COLORS.gray200
              let ribbon = null
              if (phase === PHASE.FEEDBACK) {
                if (isCorrectOpt) borderColor = COLORS.green
                else if (isChosen) borderColor = COLORS.red
                if (isCorrectOpt) ribbon = { color: COLORS.green, icon: <Check size={12} strokeWidth={3} color="white" /> }
                else if (isChosen) ribbon = { color: COLORS.red, icon: <X size={12} strokeWidth={3} color="white" /> }
              } else if (isChosen) {
                borderColor = COLORS.blue
              }

              return (
                <button
                  key={i + signId}
                  onClick={() => handleSelect(i)}
                  disabled={phase === PHASE.FEEDBACK}
                  className="relative rounded-2xl overflow-hidden bg-white text-left transition-all"
                  style={{
                    border: `3px solid ${borderColor}`,
                    cursor: phase === PHASE.FEEDBACK ? 'default' : 'pointer',
                    transform: phase === PHASE.PLAY && isChosen ? 'scale(0.98)' : undefined,
                  }}
                >
                  {ribbon && (
                    <div
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: ribbon.color }}
                    >
                      {ribbon.icon}
                    </div>
                  )}
                  <div className="aspect-video bg-black">
                    {videoUrl ? (
                      <video
                        ref={(el) => (optionVideoRefs.current[i] = el)}
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center px-2"
                        style={{ background: COLORS.gray100 }}>
                        <p className="text-2xl font-black" style={{ color: COLORS.purple }}>
                          {sign?.name_ko ?? signId}
                        </p>
                        <p className="text-[9px] font-bold mt-1" style={{ color: COLORS.gray400 }}>
                          {lang === 'ko' ? '(영상 미녹화)' : '(no video)'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="px-2 py-1.5 text-center">
                    <p className="text-xs font-black truncate" style={{ color: COLORS.gray800 }}>
                      {lang === 'ko' ? (sign?.name_ko ?? signId) : (sign?.name_en ?? signId)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {phase === PHASE.FEEDBACK && (
            <FeedbackFooter
              lang={lang}
              correctSign={getSign(round.correctSignId)}
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
    <Card3D color={COLORS.blue} padding="p-6">
      <div className="flex items-center gap-4">
        <HandMascot size={64} mood="excited" />
        <div className="flex-1">
          <h2 className="text-xl font-black" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '장면을 보고 알맞은 수어를 골라보세요!' : 'Pick the sign that matches the scene'}
          </h2>
          <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray500 }}>
            {lang === 'ko'
              ? '단어가 어떤 상황·사물에 쓰이는지 시각적으로 익히는 모드예요.'
              : 'Build the connection between real-world scenes and the right sign.'}
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-1.5 text-xs font-bold" style={{ color: COLORS.gray600 }}>
        <li>• {lang === 'ko' ? `한 세션당 ${ROUNDS_PER_SESSION}문제` : `${ROUNDS_PER_SESSION} questions per session`}</li>
        <li>• {lang === 'ko' ? `정답 시 +${BASE_XP} XP, +${BASE_STARS} ★` : `+${BASE_XP} XP and +${BASE_STARS} ★ per correct answer`}</li>
        <li>• {lang === 'ko' ? `3연속 정답 시 보너스 +${STREAK_BONUS_STARS} ★` : `3-in-a-row bonus: +${STREAK_BONUS_STARS} ★`}</li>
        <li>• {lang === 'ko' ? `총 ${PHOTO_QUIZ_BANK.length}개 장면 풀에서 출제` : `Drawn from ${PHOTO_QUIZ_BANK.length} scenes`}</li>
      </ul>

      <div className="mt-5">
        <Button3D
          fullWidth
          size="lg"
          color={COLORS.blue}
          darkColor={COLORS.blueDark}
          icon={<Camera size={18} />}
          onClick={onStart}
        >
          {lang === 'ko' ? '퀴즈 시작' : 'Start Quiz'}
        </Button3D>
      </div>
    </Card3D>
  )
}

function FeedbackFooter({ lang, correctSign, last, onAdvance, isLastRound }) {
  if (!last) return null
  const isCorrect = last.correct
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
            {lang === 'ko' ? '정답: ' : 'Answer: '}
            <span className="font-black" style={{ color: COLORS.blue }}>
              {lang === 'ko' ? correctSign?.name_ko : correctSign?.name_en}
            </span>
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
          color={COLORS.blue}
          darkColor={COLORS.blueDark}
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
    <Card3D color={isPerfect ? COLORS.green : COLORS.blue} padding="p-6" className="text-center">
      <div className="flex justify-center mb-2">
        <HandMascot size={72} mood={isPerfect ? 'excited' : correctCount > 0 ? 'neutral' : 'sad'} />
      </div>
      <h2 className="text-2xl font-black" style={{ color: COLORS.gray800 }}>
        {isPerfect
          ? (lang === 'ko' ? '🏆 완벽!' : '🏆 Perfect!')
          : (lang === 'ko' ? '수고했어요!' : 'Nice work!')}
      </h2>
      <p className="text-4xl font-black mt-3" style={{ color: COLORS.blue }}>
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
          color={COLORS.blue}
          darkColor={COLORS.blueDark}
          icon={<RotateCcw size={16} />}
          onClick={onRestart}
        >
          {lang === 'ko' ? '한 번 더' : 'Play again'}
        </Button3D>
      </div>
    </Card3D>
  )
}
