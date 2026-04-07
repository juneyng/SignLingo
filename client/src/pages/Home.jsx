import { useNavigate } from 'react-router-dom'
import { BookOpen, Zap, ChevronRight, Target, Clock, Star } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Button3D, Card3D, AccentCard, ProgressBar, StatCard, MissionCard } from '@/design-system/components'
import { HandMascot, FlameSVG } from '@/design-system/icons'
import { UNITS, TOTAL_SIGNS } from '@/data/signDatabase'
import useLanguage from '@/stores/useLanguage'

export default function Home() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  const firstUnit = UNITS[0]

  const missions = [
    { icon: <Target size={16} color={COLORS.blue} />, title: t.practice3Signs, progress: 0, target: 3, xp: 15 },
    { icon: <Clock size={16} color={COLORS.purple} />, title: t.fiveMinSession, progress: 0, target: 1, xp: 10 },
  ]

  return (
    <div className="space-y-5 animate-[fadeIn_0.7s_ease]">
      {/* Greeting */}
      <div className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: `linear-gradient(135deg, ${COLORS.green}, #4DB800)`, borderBottom: `5px solid ${COLORS.greenDark}` }}>
        <div className="flex-shrink-0" style={{ animation: 'bounce 2s infinite' }}>
          <HandMascot size={64} mood="happy" />
        </div>
        <div className="text-white flex-1">
          <h2 className="text-xl font-black leading-tight">{t.homeGreeting}</h2>
          <p className="text-sm opacity-90 mt-1 font-semibold">{t.homeSubtitle}</p>
        </div>
        <div className="flex items-center gap-1 bg-white/20 rounded-xl px-3 py-2">
          <FlameSVG size={20} />
          <span className="text-white font-black text-lg">0</span>
        </div>
      </div>

      {/* Stats + Continue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <StatCard icon={<FlameSVG size={20} />} value="0" label={t.dayStreak} color={COLORS.orange} />
          <StatCard icon={<Star size={18} fill={COLORS.yellow} stroke={COLORS.yellowDark} />} value="0" label={t.totalXP} color={COLORS.yellow} />
          <StatCard icon={<BookOpen size={18} color={COLORS.blue} strokeWidth={2.5} />} value={`0/${TOTAL_SIGNS}`} label={t.signsLearned} color={COLORS.blue} />
        </div>

        <Card3D color={COLORS.gray200} padding="p-5" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-extrabold" style={{ color: COLORS.gray800 }}>{t.continueLearning}</h3>
            <span className="text-xs font-bold" style={{ color: COLORS.gray400 }}>
              0/{firstUnit.signs.length} {t.signs}
            </span>
          </div>
          <p className="text-xs font-semibold mb-3" style={{ color: COLORS.gray500 }}>
            {t.unit} 1: {lang === 'ko' ? firstUnit.titleKo : firstUnit.titleEn}
          </p>
          <ProgressBar progress={0} color={COLORS.green} />

          {/* Preview first 4 signs */}
          <div className="grid grid-cols-4 gap-2 mt-4">
            {firstUnit.signs.slice(0, 4).map((sign) => (
              <div key={sign.id} className="rounded-xl p-3 text-center hover:scale-[1.02] transition-transform cursor-pointer"
                style={{ background: COLORS.gray50, border: `2px solid ${COLORS.gray200}` }}
                onClick={() => navigate(`/lessons/${firstUnit.id}`)}>
                <p className="text-xl font-black" style={{ color: COLORS.gray800 }}>{sign.name_ko}</p>
                <p className="text-[9px] font-bold mt-0.5" style={{ color: COLORS.gray400 }}>{sign.name_en}</p>
              </div>
            ))}
          </div>

          <Button3D fullWidth className="mt-4" icon={<BookOpen size={18} />} onClick={() => navigate('/lessons')}>
            {t.startLearning}
          </Button3D>
        </Card3D>
      </div>

      {/* Missions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold" style={{ color: COLORS.gray800 }}>{t.dailyMissions}</h3>
            <button onClick={() => navigate('/missions')} className="flex items-center gap-0.5 cursor-pointer">
              <span className="text-xs font-bold" style={{ color: COLORS.blue }}>{t.seeAll}</span>
              <ChevronRight size={14} color={COLORS.blue} />
            </button>
          </div>
          <div className="space-y-2">{missions.map((m, i) => <MissionCard key={i} {...m} />)}</div>
        </div>

        <Card3D color={COLORS.gray200} padding="p-5">
          <h3 className="font-extrabold mb-3" style={{ color: COLORS.gray800 }}>{t.recentSigns}</h3>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <HandMascot size={48} mood="neutral" />
              <p className="text-sm font-bold mt-2" style={{ color: COLORS.gray400 }}>{t.noSignsYet}</p>
              <p className="text-xs font-semibold" style={{ color: COLORS.gray300 }}>{t.startFirstLesson}</p>
            </div>
          </div>
        </Card3D>
      </div>

      {/* Quick Challenge */}
      <AccentCard color={COLORS.blue} darkColor={COLORS.blueDark} onClick={() => navigate('/missions')}>
        <div className="flex items-center gap-3">
          <Zap size={28} color="white" strokeWidth={2.5} />
          <div>
            <p className="text-white font-extrabold text-sm">{t.quickChallenge}</p>
            <p className="text-white/70 text-xs font-semibold mt-0.5">{t.quickChallengeDesc}</p>
          </div>
          <ChevronRight size={20} color="white" className="ml-auto" />
        </div>
      </AccentCard>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  )
}
