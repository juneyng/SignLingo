import { useNavigate } from 'react-router-dom'
import { Target, Zap, Gift, Clock, Award, Lock, Trophy, BookOpen } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Card3D, AccentCard, MissionCard, Button3D } from '@/design-system/components'
import { HandMascot } from '@/design-system/icons'
import useLanguage from '@/stores/useLanguage'

const achievementsDef = [
  { nameEn: 'First Sign', nameKo: '첫 수어', icon: <Award size={20} />, color: COLORS.green, earned: false },
  { nameEn: 'Week Streak', nameKo: '주간 연속', icon: <Zap size={20} />, color: COLORS.orange, earned: false },
  { nameEn: 'Perfect', nameKo: '만점', icon: <Trophy size={20} />, color: COLORS.yellow, earned: false },
  { nameEn: '10 Signs', nameKo: '10개 수어', icon: <BookOpen size={20} />, color: COLORS.blue, earned: false },
  { nameEn: 'Speed King', nameKo: '스피드 킹', icon: <Clock size={20} />, color: COLORS.purple, earned: false },
]

export default function MissionMode() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  const missions = [
    { icon: <Target size={16} color={COLORS.blue} />, title: t.practice3Signs, progress: 0, target: 3, xp: 15 },
    { icon: <Clock size={16} color={COLORS.purple} />, title: t.fiveMinSession, progress: 0, target: 1, xp: 10 },
    { icon: <Zap size={16} color={COLORS.orange} />, title: t.score80, progress: 0, target: 1, xp: 20 },
  ]

  return (
    <div className="space-y-5 animate-[fadeIn_0.7s_ease]">
      <div>
        <h1 className="text-2xl font-black" style={{ color: COLORS.gray800 }}>{t.missionsTitle}</h1>
        <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray400 }}>{t.missionsSubtitle}</p>
      </div>

      {/* Daily reward + missions — side by side on wide screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card3D color={COLORS.orange + '40'} padding="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: COLORS.orangeBg }}>
              <Gift size={20} color={COLORS.orange} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-sm" style={{ color: COLORS.gray800 }}>{t.dailyBonus}</p>
              <p className="text-xs font-semibold" style={{ color: COLORS.gray500 }}>{t.dailyBonusDesc}</p>
            </div>
            <span className="font-black text-sm" style={{ color: COLORS.orange }}>0/3</span>
          </div>
        </Card3D>

        <div className="lg:col-span-2 space-y-2">
          <h3 className="font-extrabold text-sm" style={{ color: COLORS.gray800 }}>{t.todaysMissions}</h3>
          {missions.map((m, i) => <MissionCard key={i} {...m} />)}
        </div>
      </div>

      {/* Quick Challenges */}
      <div>
        <h3 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>{t.quickChallenge}</h3>
        <div className="grid grid-cols-3 gap-3">
          <AccentCard color={COLORS.green} darkColor={COLORS.greenDark} onClick={() => navigate('/lessons/consonants1')}>
            <Zap size={22} color="white" strokeWidth={2.5} />
            <p className="text-white font-extrabold text-xs mt-2">{t.speedRound}</p>
          </AccentCard>
          <AccentCard color={COLORS.blue} darkColor={COLORS.blueDark} onClick={() => navigate('/lessons/consonants1')}>
            <Target size={22} color="white" strokeWidth={2.5} />
            <p className="text-white font-extrabold text-xs mt-2">{t.accuracy}</p>
          </AccentCard>
          <AccentCard color={COLORS.purple} darkColor={COLORS.purpleDark} onClick={() => navigate('/lessons/consonants1')}>
            <BookOpen size={22} color="white" strokeWidth={2.5} />
            <p className="text-white font-extrabold text-xs mt-2">{t.signQuiz}</p>
          </AccentCard>
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h3 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>{t.achievements}</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {achievementsDef.map((ach, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center relative"
                style={{ background: ach.earned ? ach.color + '20' : COLORS.gray100,
                  border: `2px solid ${ach.earned ? ach.color : COLORS.gray200}`, color: ach.earned ? ach.color : COLORS.gray300 }}>
                {ach.icon}
                {!ach.earned && <div className="absolute inset-0 rounded-full flex items-center justify-center bg-white/60"><Lock size={14} color={COLORS.gray400} /></div>}
              </div>
              <span className="text-[10px] font-bold text-center w-14" style={{ color: ach.earned ? COLORS.gray700 : COLORS.gray400 }}>
                {lang === 'ko' ? ach.nameKo : ach.nameEn}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
