import { useEffect, useRef, useState } from 'react'
import { Check, ShieldCheck, ChevronDown } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import useAuth from '@/hooks/useAuth'
import useProfile from '@/hooks/useProfile'
import useLanguage from '@/stores/useLanguage'

const MAX_NAME = 20
const MIN_NAME = 1
const MIN_AGE = 14
const CURRENT_YEAR = new Date().getFullYear()
const MAX_BIRTH_YEAR = CURRENT_YEAR - MIN_AGE
const MIN_BIRTH_YEAR = 1920

// Option whitelists — these strings are what gets persisted in DB.
const GENDER_OPTS = [
  { value: 'female', ko: '여성', en: 'Female' },
  { value: 'male',   ko: '남성', en: 'Male' },
]
const EXPERIENCE_OPTS = [
  { value: 'beginner',  ko: '처음',          en: 'Beginner' },
  { value: 'some',      ko: '조금 아는 정도', en: 'Some knowledge' },
  { value: 'advanced',  ko: '잘함',          en: 'Advanced' },
  { value: 'native',    ko: '원어민/농인',    en: 'Native / Deaf' },
]
const PURPOSE_OPTS = [
  { value: 'hobby',         ko: '취미',         en: 'Hobby' },
  { value: 'work',          ko: '직업',         en: 'Work' },
  { value: 'volunteer',     ko: '봉사',         en: 'Volunteering' },
  { value: 'family_friend', ko: '가족·지인',    en: 'Family / friend' },
  { value: 'other',         ko: '기타',         en: 'Other' },
]
const OCCUPATION_OPTS = [
  { value: 'middle_high_student', ko: '중·고등학생',     en: 'Middle/High school' },
  { value: 'undergraduate',       ko: '대학생',          en: 'Undergraduate' },
  { value: 'graduate',            ko: '대학원생',        en: 'Graduate' },
  { value: 'employed',            ko: '직장인',          en: 'Employed' },
  { value: 'public_servant',      ko: '공무원',          en: 'Public servant' },
  { value: 'freelance_self',      ko: '프리랜서·자영업', en: 'Freelance / self-employed' },
  { value: 'homemaker',           ko: '주부',            en: 'Homemaker' },
  { value: 'unemployed',          ko: '구직중·무직',     en: 'Unemployed / job-seeking' },
  { value: 'retired',             ko: '은퇴',            en: 'Retired' },
  { value: 'other',               ko: '기타',            en: 'Other' },
]

/**
 * Privacy + nickname + optional demographics modal.
 *
 * Sections (top → bottom):
 *   1. Required: nickname
 *   2. Optional: birth year, gender, KSL experience, learning purpose, occupation
 *   3. Required: consent checkbox
 *
 * - z-[200] — above OnboardingTour (z-[100/101]) and any in-page modal (z-50)
 * - Cannot be dismissed: no X, ESC and backdrop clicks blocked
 */
export default function OnboardingConsentModal() {
  const { user } = useAuth()
  const { profile, complete } = useProfile()
  const { lang } = useLanguage()

  const initialName =
    profile?.display_name?.trim()
    || user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || ''

  // Form state
  const [name, setName] = useState(initialName)
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('')
  const [experience, setExperience] = useState('')
  const [purpose, setPurpose] = useState('')
  const [occupation, setOccupation] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Re-sync prefill if the profile row arrives after mount
  useEffect(() => {
    if (!name && initialName) setName(initialName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialName])

  // Block ESC while modal is open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  const trimmedName = name.trim()
  const nameValid = trimmedName.length >= MIN_NAME && trimmedName.length <= MAX_NAME
  const birthYearNum = birthYear === '' ? null : Number(birthYear)
  const birthYearProvided = birthYearNum !== null
  const birthYearValid =
    birthYearProvided
    && Number.isInteger(birthYearNum)
    && birthYearNum >= MIN_BIRTH_YEAR
    && birthYearNum <= MAX_BIRTH_YEAR

  // All demographics now required.
  const demoComplete = !!gender && !!experience && !!purpose && !!occupation
  const canSubmit = nameValid && birthYearValid && demoComplete && agreed && !saving

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSaving(true)
    setError(null)
    try {
      await complete({
        display_name: trimmedName,
        birth_year: birthYearNum,
        gender,
        ksl_experience: experience,
        learning_purpose: purpose,
        occupation_type: occupation,
      })
    } catch (e) {
      console.error('[Consent] save failed:', e)
      setError(
        lang === 'ko'
          ? '저장 중 문제가 생겼어요. 다시 시도해주세요.'
          : 'Could not save. Please try again.'
      )
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-4 py-6 animate-[fadeIn_0.25s_ease]"
      style={{ background: 'rgba(0, 0, 0, 0.7)', zIndex: 200 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="rounded-3xl bg-white max-w-md w-full p-6 overflow-y-auto"
        style={{
          border: `2px solid ${COLORS.green}`,
          borderBottom: `5px solid ${COLORS.greenDark}`,
          maxHeight: 'calc(100vh - 48px)',
        }}
      >
        {/* HEADER */}
        <div className="flex flex-col items-center text-center">
          <HandMascot size={56} mood="excited" />
          <h2 className="text-xl font-black mt-3" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? 'SignLingo에 오신 것을 환영해요!' : 'Welcome to SignLingo!'}
          </h2>
          <p className="text-xs font-semibold mt-1" style={{ color: COLORS.gray500 }}>
            {lang === 'ko'
              ? '시작하기 전에 간단히 몇 가지만 확인할게요.'
              : 'A couple of quick questions before you start.'}
          </p>
        </div>

        {/* === REQUIRED: NICKNAME === */}
        <SectionLabel lang={lang} required>
          {lang === 'ko' ? '닉네임' : 'Nickname'}
        </SectionLabel>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
          maxLength={MAX_NAME}
          placeholder={lang === 'ko' ? '예: 김수어' : 'e.g. Alex'}
          className="w-full px-3 py-2.5 rounded-xl text-sm font-bold outline-none focus:scale-[1.01] transition-transform"
          style={{
            border: `2px solid ${nameValid ? COLORS.green : COLORS.gray300}`,
            background: 'white',
            color: COLORS.gray800,
          }}
          autoFocus
        />
        <p className="text-[10px] font-bold mt-1" style={{ color: COLORS.gray400 }}>
          {lang === 'ko'
            ? `1~${MAX_NAME}자 사이로 입력해주세요. 나중에 변경 가능합니다.`
            : `1–${MAX_NAME} characters. You can change this later.`}
        </p>

        {/* DIVIDER */}
        <div className="my-5 flex items-center gap-2">
          <div className="flex-1 h-px" style={{ background: COLORS.gray200 }} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider"
            style={{ color: COLORS.gray400 }}>
            {lang === 'ko' ? '인적 사항' : 'Personal info'}
          </span>
          <div className="flex-1 h-px" style={{ background: COLORS.gray200 }} />
        </div>

        {/* === BIRTH YEAR === */}
        <SectionLabel lang={lang} required>
          {lang === 'ko' ? '출생년도' : 'Birth year'}
        </SectionLabel>
        <input
          type="number"
          value={birthYear}
          onChange={(e) => setBirthYear(e.target.value)}
          min={MIN_BIRTH_YEAR}
          max={MAX_BIRTH_YEAR}
          placeholder={lang === 'ko' ? '예: 2000' : 'e.g. 2000'}
          className="w-full px-3 py-2 rounded-xl text-sm font-bold outline-none focus:scale-[1.01] transition-transform"
          style={{
            border: `2px solid ${birthYearValid ? COLORS.green : birthYearProvided ? COLORS.red : COLORS.gray300}`,
            background: 'white',
            color: COLORS.gray800,
          }}
        />
        {birthYearProvided && !birthYearValid && (
          <p className="text-[10px] font-bold mt-1" style={{ color: COLORS.red }}>
            {lang === 'ko'
              ? `${MIN_BIRTH_YEAR}~${MAX_BIRTH_YEAR} 사이의 연도를 입력해주세요.`
              : `Please enter a year between ${MIN_BIRTH_YEAR} and ${MAX_BIRTH_YEAR}.`}
          </p>
        )}

        {/* === GENDER === */}
        <SectionLabel required>
          {lang === 'ko' ? '성별' : 'Gender'}
        </SectionLabel>
        <SelectDropdown
          value={gender}
          onChange={setGender}
          options={GENDER_OPTS}
          lang={lang}
          placeholder={lang === 'ko' ? '선택해주세요' : 'Select an option'}
        />

        {/* === KSL EXPERIENCE === */}
        <SectionLabel required>
          {lang === 'ko' ? '수어 경험' : 'KSL experience'}
        </SectionLabel>
        <SelectDropdown
          value={experience}
          onChange={setExperience}
          options={EXPERIENCE_OPTS}
          lang={lang}
          placeholder={lang === 'ko' ? '선택해주세요' : 'Select an option'}
        />

        {/* === LEARNING PURPOSE === */}
        <SectionLabel required>
          {lang === 'ko' ? '학습 목적' : 'Learning purpose'}
        </SectionLabel>
        <SelectDropdown
          value={purpose}
          onChange={setPurpose}
          options={PURPOSE_OPTS}
          lang={lang}
          placeholder={lang === 'ko' ? '선택해주세요' : 'Select an option'}
        />

        {/* === OCCUPATION === */}
        <SectionLabel required>
          {lang === 'ko' ? '직업·소속' : 'Occupation'}
        </SectionLabel>
        <SelectDropdown
          value={occupation}
          onChange={setOccupation}
          options={OCCUPATION_OPTS}
          lang={lang}
          placeholder={lang === 'ko' ? '선택해주세요' : 'Select an option'}
        />

        {/* === REQUIRED: PRIVACY CONSENT === */}
        <div className="mt-6 rounded-2xl p-4"
          style={{ background: `${COLORS.blue}10`, border: `2px solid ${COLORS.blue}30` }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={16} color={COLORS.blue} strokeWidth={2.5} />
            <p className="text-xs font-extrabold" style={{ color: COLORS.blue }}>
              {lang === 'ko' ? '개인정보 처리 동의' : 'Privacy & Data'}
            </p>
          </div>
          <ul className="space-y-1.5 text-[11px] font-bold leading-snug" style={{ color: COLORS.gray700 }}>
            {(lang === 'ko'
              ? [
                  'SignLingo는 학습 진도(XP, 스타, 스트릭), 닉네임, 이메일, 그리고 선택적으로 입력한 인구통계 정보만 저장합니다.',
                  '웹캠 영상은 브라우저에서만 처리되며, 외부 서버로 전송되지 않습니다.',
                  '익명화된 통계는 학습 효과 분석 및 서비스 개선 목적으로만 활용됩니다.',
                ]
              : [
                  'SignLingo only stores your learning progress (XP, stars, streak), nickname, email, and any demographics you choose to share.',
                  'Your webcam feed is processed entirely in your browser — it never leaves your device.',
                  'Anonymized statistics may be used for learning-efficacy analysis and service improvement.',
                ]
            ).map((line, i) => (
              <li key={i} className="flex gap-1.5">
                <span style={{ color: COLORS.blue }}>•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="mt-4 flex items-start gap-2.5 cursor-pointer select-none">
          <span
            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all mt-0.5"
            style={{
              background: agreed ? COLORS.green : 'white',
              border: `2px solid ${agreed ? COLORS.green : COLORS.gray300}`,
            }}
          >
            {agreed && <Check size={12} strokeWidth={3} color="white" />}
          </span>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="sr-only"
          />
          <span className="text-xs font-bold leading-snug" style={{ color: COLORS.gray700 }}>
            {lang === 'ko'
              ? '위 내용을 확인했으며 동의합니다.'
              : "I've read and agree to the above."}
          </span>
        </label>

        {error && (
          <p className="mt-3 text-xs font-bold text-center" style={{ color: COLORS.red }}>
            {error}
          </p>
        )}

        <div className="mt-5">
          <Button3D
            fullWidth
            size="lg"
            color={canSubmit ? COLORS.green : COLORS.gray300}
            darkColor={canSubmit ? COLORS.greenDark : COLORS.gray400}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {saving
              ? (lang === 'ko' ? '저장 중...' : 'Saving...')
              : (lang === 'ko' ? '시작하기' : 'Get started')}
          </Button3D>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  )
}

function SectionLabel({ children, required = false }) {
  return (
    <label className="text-xs font-extrabold mt-4 mb-1.5 flex items-center gap-1"
      style={{ color: COLORS.gray700 }}>
      <span>{children}</span>
      {required && (
        <span className="text-[10px] font-black" style={{ color: COLORS.red }}>*</span>
      )}
    </label>
  )
}

/**
 * Custom select dropdown with a slide-down menu.
 * Closes on outside click and on option pick.
 */
function SelectDropdown({ value, onChange, options, lang, placeholder }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find((o) => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2.5 rounded-xl text-sm font-extrabold text-left flex items-center justify-between transition-colors"
        style={{
          border: `2px solid ${value ? COLORS.green : open ? COLORS.gray400 : COLORS.gray300}`,
          background: 'white',
          color: value ? COLORS.gray800 : COLORS.gray400,
        }}
      >
        <span className="truncate">
          {selected ? (lang === 'ko' ? selected.ko : selected.en) : placeholder}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={3}
          color={value ? COLORS.green : COLORS.gray400}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Slide-down menu */}
      <div
        className="overflow-hidden"
        style={{
          maxHeight: open ? 360 : 0,
          opacity: open ? 1 : 0,
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        <div
          className="mt-1.5 rounded-xl bg-white p-1"
          style={{
            border: `2px solid ${COLORS.gray200}`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className="w-full px-2.5 py-2 rounded-lg text-xs font-extrabold text-left flex items-center gap-2 transition-colors cursor-pointer"
                style={{
                  background: active ? `${COLORS.green}15` : 'transparent',
                  color: active ? COLORS.greenDark : COLORS.gray700,
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = COLORS.gray100
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <span
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                  style={{
                    background: active ? COLORS.green : 'transparent',
                    border: `2px solid ${active ? COLORS.green : COLORS.gray300}`,
                  }}
                >
                  {active && <Check size={10} strokeWidth={3} color="white" />}
                </span>
                <span className="truncate">{lang === 'ko' ? opt.ko : opt.en}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
