import { useEffect, useState, useRef } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import useLanguage from '@/stores/useLanguage'

const STORAGE_KEY = 'signlingo_onboarding_completed'

const STEPS = {
  ko: [
    {
      target: null,
      title: 'SignLingo에 오신 걸 환영해요!',
      desc: '한국 수어를 배우는 인터랙티브 학습 앱이에요. 짧은 가이드로 사용법을 알려드릴게요.',
      mascot: 'excited',
    },
    {
      target: '[data-tour="nav-record"]',
      title: '1단계: 참조 영상 등록',
      desc: '먼저 "녹화" 페이지로 이동해서 수어 영상을 업로드하거나 직접 녹화해 등록해주세요. 이 데이터로 정확한 비교가 이루어져요.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-lessons"]',
      title: '2단계: 학습 시작',
      desc: '"학습"에서 수어를 단원별로 연습할 수 있어요. 등록한 수어를 직접 따라해 보세요!',
      position: 'right',
    },
    {
      target: '[data-tour="lang-toggle"]',
      title: '언어 전환',
      desc: '오른쪽 상단 KO/EN 버튼으로 언제든 언어를 바꿀 수 있어요.',
      position: 'bottom',
    },
    {
      target: null,
      title: '준비 완료!',
      desc: '이제 직접 사용해 보세요. 즐거운 학습 되세요 🤟',
      mascot: 'happy',
    },
  ],
  en: [
    {
      target: null,
      title: 'Welcome to SignLingo!',
      desc: 'Interactive Korean Sign Language learning. Let me show you how to use it.',
      mascot: 'excited',
    },
    {
      target: '[data-tour="nav-record"]',
      title: 'Step 1: Register Reference',
      desc: 'First, go to the Record page to upload or record sign videos. This data is used for accurate comparison.',
      position: 'right',
    },
    {
      target: '[data-tour="nav-lessons"]',
      title: 'Step 2: Start Learning',
      desc: 'In Lessons, practice signs unit by unit. Try the signs you registered!',
      position: 'right',
    },
    {
      target: '[data-tour="lang-toggle"]',
      title: 'Language Toggle',
      desc: 'Switch between KO/EN anytime using the toggle in the top right.',
      position: 'bottom',
    },
    {
      target: null,
      title: "You're all set!",
      desc: 'Try it out yourself. Happy learning 🤟',
      mascot: 'happy',
    },
  ],
}

export default function OnboardingTour() {
  const { lang } = useLanguage()
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [targetRect, setTargetRect] = useState(null)

  // Show on first visit
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      setTimeout(() => setActive(true), 600)
    }

    // Listen for replay event from Help button
    const replayHandler = () => {
      setStepIdx(0)
      setTargetRect(null)
      setActive(true)
    }
    window.addEventListener('signlingo:replay-tour', replayHandler)
    return () => window.removeEventListener('signlingo:replay-tour', replayHandler)
  }, [])

  const steps = STEPS[lang] || STEPS.en
  const currentStep = steps[stepIdx]

  // Update spotlight when step or language changes
  useEffect(() => {
    if (!active) return
    if (!currentStep?.target) {
      setTargetRect(null)
      return
    }
    const update = () => {
      const el = document.querySelector(currentStep.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        })
      } else {
        setTargetRect(null)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [active, stepIdx, currentStep, lang])

  const close = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setActive(false)
  }

  const next = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1)
    else close()
  }

  const prev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1)
  }

  if (!active) return null

  // Determine card position — always use top/left in pixels (no transform)
  const CARD_W = 380
  const CARD_H = 240
  const PADDING = 20
  let cardStyle
  if (!targetRect) {
    // Centered on screen
    cardStyle = {
      top: Math.max(PADDING, (window.innerHeight - CARD_H) / 2),
      left: Math.max(PADDING, (window.innerWidth - CARD_W) / 2),
    }
  } else if (currentStep.position === 'right') {
    cardStyle = {
      top: Math.max(PADDING, Math.min(window.innerHeight - CARD_H - PADDING, targetRect.top + targetRect.height / 2 - 100)),
      left: Math.min(window.innerWidth - CARD_W - PADDING, targetRect.left + targetRect.width + 16),
    }
  } else if (currentStep.position === 'bottom') {
    cardStyle = {
      top: Math.min(window.innerHeight - CARD_H - PADDING, targetRect.top + targetRect.height + 16),
      left: Math.max(PADDING, Math.min(window.innerWidth - CARD_W - PADDING, targetRect.left + targetRect.width / 2 - CARD_W / 2)),
    }
  } else {
    cardStyle = {
      top: Math.min(window.innerHeight - CARD_H - PADDING, targetRect.top + targetRect.height + 16),
      left: Math.max(PADDING, Math.min(window.innerWidth - CARD_W - PADDING, targetRect.left)),
    }
  }

  return (
    <>
      {/* Overlay with spotlight cutout */}
      <div
        className="fixed inset-0 z-[100] pointer-events-auto animate-[overlayFade_0.6s_ease]"
        style={{ background: 'rgba(0, 0, 0, 0.65)' }}
      >
        {targetRect && (
          <div
            className="absolute rounded-2xl pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
              border: `3px solid ${COLORS.green}`,
              animation: 'pulse 2s infinite',
              transition: 'top 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1), width 0.7s cubic-bezier(0.4, 0, 0.2, 1), height 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        )}
      </div>

      {/* Tour card */}
      <div
        className="fixed z-[101] animate-[cardFadeIn_0.6s_ease]"
        style={{
          ...cardStyle,
          maxWidth: 380,
          width: 'calc(100% - 40px)',
          transition: 'top 0.7s cubic-bezier(0.4, 0, 0.2, 1), left 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          className="rounded-2xl p-5"
          style={{
            background: COLORS.white,
            border: `2px solid ${COLORS.green}`,
            borderBottom: `5px solid ${COLORS.greenDark}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}
        >
          {/* Close button */}
          <button
            onClick={close}
            className="absolute top-3 right-3 cursor-pointer hover:scale-110 transition-transform"
          >
            <X size={18} color={COLORS.gray400} strokeWidth={2.5} />
          </button>

          {/* Mascot for non-target steps */}
          {!currentStep.target && currentStep.mascot && (
            <div className="flex justify-center mb-2">
              <HandMascot size={64} mood={currentStep.mascot} />
            </div>
          )}

          <h3 className="font-black text-lg pr-6" style={{ color: COLORS.gray800 }}>
            {currentStep.title}
          </h3>
          <p className="text-sm font-semibold mt-2" style={{ color: COLORS.gray600 }}>
            {currentStep.desc}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === stepIdx ? 24 : 8,
                  height: 8,
                  background: i === stepIdx ? COLORS.green : COLORS.gray200,
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-4">
            {stepIdx > 0 && (
              <ButtonOutline
                color={COLORS.gray400}
                size="sm"
                onClick={prev}
                icon={<ChevronLeft size={14} />}
              >
                {lang === 'ko' ? '이전' : 'Back'}
              </ButtonOutline>
            )}
            <Button3D
              size="sm"
              className="flex-1"
              onClick={next}
              icon={stepIdx < steps.length - 1 ? <ChevronRight size={14} /> : null}
            >
              {stepIdx < steps.length - 1
                ? (lang === 'ko' ? '다음' : 'Next')
                : (lang === 'ko' ? '시작하기' : 'Get Started')}
            </Button3D>
          </div>

          {/* Skip link */}
          {stepIdx < steps.length - 1 && (
            <button
              onClick={close}
              className="block mx-auto mt-3 text-xs font-bold cursor-pointer"
              style={{ color: COLORS.gray400 }}
            >
              {lang === 'ko' ? '건너뛰기' : 'Skip tour'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 0 ${COLORS.green}80; }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 8px ${COLORS.green}40; }
        }
        @keyframes overlayFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cardFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  )
}
