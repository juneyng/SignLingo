import { useNavigate } from 'react-router-dom'
import { BookOpen, Target, Award } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, ButtonOutline, Card3D } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import useLanguage from '@/stores/useLanguage'

export default function Landing() {
  const navigate = useNavigate()
  const { t, toggle, lang } = useLanguage()

  const features = [
    { icon: <BookOpen size={28} color={COLORS.blue} strokeWidth={2.5} />, color: COLORS.blue, title: t.guidedLessons, desc: t.guidedLessonsDesc },
    { icon: <Target size={28} color={COLORS.orange} strokeWidth={2.5} />, color: COLORS.orange, title: t.realtimeFeedback, desc: t.realtimeFeedbackDesc },
    { icon: <Award size={28} color={COLORS.purple} strokeWidth={2.5} />, color: COLORS.purple, title: t.gamification, desc: t.gamificationDesc },
  ]

  const steps = [{ label: t.step1 }, { label: t.step2 }, { label: t.step3 }, { label: t.step4 }]

  return (
    <div className="min-h-screen" style={{ background: COLORS.bg }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <HandMascot size={36} mood="happy" />
          <span className="text-xl font-black" style={{ color: COLORS.green }}>SignLingo</span>
        </div>
        <div className="flex items-center gap-3">
          {/* KO|EN */}
          <button onClick={toggle} className="flex items-center rounded-xl overflow-hidden cursor-pointer"
            style={{ border: `2px solid ${COLORS.gray200}` }}>
            <span className="px-3 py-1 text-xs font-black transition-all"
              style={{ background: lang === 'ko' ? COLORS.green : 'transparent', color: lang === 'ko' ? 'white' : COLORS.gray400 }}>KO</span>
            <span className="px-3 py-1 text-xs font-black transition-all"
              style={{ background: lang === 'en' ? COLORS.green : 'transparent', color: lang === 'en' ? 'white' : COLORS.gray400 }}>EN</span>
          </button>
          <ButtonOutline color={COLORS.gray600} size="sm" onClick={() => navigate('/login')}>{t.login}</ButtonOutline>
          <Button3D size="sm" onClick={() => navigate('/login')}>{t.start}</Button3D>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-16 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl lg:text-5xl font-black leading-tight" style={{ color: COLORS.gray800 }}>
            {t.landingHero} <span style={{ color: COLORS.green }}>{t.landingHeroAccent}</span>
          </h1>
          <p className="text-base font-semibold mt-4 max-w-lg" style={{ color: COLORS.gray600 }}>{t.landingDesc}</p>
          <div className="flex gap-3 mt-6 justify-center lg:justify-start">
            <Button3D size="lg" onClick={() => navigate('/login')}>{t.startFree}</Button3D>
            <ButtonOutline color={COLORS.gray500} size="lg">{t.watchDemo}</ButtonOutline>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <Card3D color={COLORS.gray200} padding="p-6" className="max-w-sm w-full">
            <div className="rounded-xl p-8 text-center" style={{ background: COLORS.gray50 }}>
              <HandMascot size={80} mood="excited" />
              <p className="text-4xl font-black mt-3" style={{ color: COLORS.gray800 }}>ㄱ</p>
              <p className="text-sm font-bold" style={{ color: COLORS.gray500 }}>Giyeok</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: COLORS.gray400 }}>{t.accuracy}</span>
              <span className="font-black" style={{ color: COLORS.green }}>92%</span>
            </div>
            <div className="h-2 rounded-full mt-1" style={{ background: COLORS.gray200 }}>
              <div className="h-2 rounded-full" style={{ width: '92%', background: COLORS.green }} />
            </div>
          </Card3D>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card3D key={f.title} color={COLORS.gray200} padding="p-5">
              <div className="h-1 rounded-full mb-4" style={{ background: f.color }} />
              {f.icon}
              <h3 className="font-black mt-3" style={{ color: COLORS.gray800 }}>{f.title}</h3>
              <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray500 }}>{f.desc}</p>
            </Card3D>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-black mb-8" style={{ color: COLORS.gray800 }}>{t.howItWorks}</h2>
        <div className="flex items-start justify-between gap-4 relative">
          <div className="absolute top-5 left-[15%] right-[15%] border-t-2 border-dashed" style={{ borderColor: COLORS.gray300 }} />
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10 flex-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white"
                style={{ background: COLORS.green, borderBottom: `3px solid ${COLORS.greenDark}` }}>{i + 1}</div>
              <span className="text-xs font-bold" style={{ color: COLORS.gray600 }}>{step.label}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-8 px-6">
        <p className="text-xs font-semibold" style={{ color: COLORS.gray400 }}>{t.footer}</p>
      </footer>
    </div>
  )
}
