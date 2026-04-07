import { Star, BookOpen, Trophy, Target } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Card3D, StatCard, ProgressBar, ButtonOutline, Button3D, Badge } from '@/design-system/components'
import { FlameSVG, HandMascot } from '@/design-system/icons'
import useLanguage from '@/stores/useLanguage'

const signMastery = [
  { sign: 'ㄱ', name: 'Giyeok', nameKo: '기역', accuracy: 0 },
  { sign: 'ㄴ', name: 'Nieun', nameKo: '니은', accuracy: 0 },
  { sign: 'ㄷ', name: 'Digeut', nameKo: '디귿', accuracy: 0 },
]

export default function Dashboard() {
  const { t, lang } = useLanguage()

  return (
    <div className="space-y-5 animate-[fadeIn_0.7s_ease]">
      <div>
        <h1 className="text-2xl font-black" style={{ color: COLORS.gray800 }}>{t.myProgress}</h1>
        <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray400 }}>{t.trackJourney}</p>
      </div>

      {/* Profile + Stats — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile */}
        <Card3D color={COLORS.gray200} padding="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl"
              style={{ background: COLORS.greenLight, color: COLORS.green }}>U</div>
            <div className="flex-1">
              <h2 className="font-black text-lg" style={{ color: COLORS.gray800 }}>User</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge color={COLORS.blue}>Level 1</Badge>
                <span className="text-xs font-semibold" style={{ color: COLORS.gray400 }}>Beginner</span>
              </div>
            </div>
            <ButtonOutline color={COLORS.gray400} size="sm">{t.edit}</ButtonOutline>
          </div>
        </Card3D>

        {/* Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Star size={18} fill={COLORS.yellow} stroke={COLORS.yellowDark} />} value="0" label={t.totalXP} color={COLORS.yellow} />
          <StatCard icon={<BookOpen size={18} color={COLORS.blue} strokeWidth={2.5} />} value="0" label={t.signsMastered} color={COLORS.blue} />
          <StatCard icon={<FlameSVG size={20} />} value="0" label={t.dayStreak} color={COLORS.orange} />
          <StatCard icon={<Target size={18} color={COLORS.green} strokeWidth={2.5} />} value="—" label={t.avgAccuracy} color={COLORS.green} />
        </div>
      </div>

      {/* Activity + Vocabulary — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Learning Activity */}
        <Card3D color={COLORS.gray200} padding="p-5">
          <h3 className="font-extrabold text-sm mb-4" style={{ color: COLORS.gray800 }}>{t.learningActivity}</h3>
          <div className="flex items-end justify-between gap-2 h-28">
            {[t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun].map((day) => (
              <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                <div className="w-full rounded-xl transition-all" style={{ height: 12, background: COLORS.gray200 }} />
                <span className="text-[10px] font-bold" style={{ color: COLORS.gray400 }}>{day}</span>
              </div>
            ))}
          </div>
          <p className="text-xs font-semibold mt-3 text-center" style={{ color: COLORS.gray400 }}>{t.startPracticing}</p>
        </Card3D>

        {/* Vocabulary Mastery */}
        <Card3D color={COLORS.gray200} padding="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-sm" style={{ color: COLORS.gray800 }}>{t.vocabMastery}</h3>
            <div className="flex gap-1.5">
              <Button3D size="xs" color={COLORS.green} darkColor={COLORS.greenDark}>{t.all}</Button3D>
              <Button3D size="xs" color={COLORS.gray200} darkColor={COLORS.gray300} textColor={COLORS.gray600}>{t.mastered}</Button3D>
              <Button3D size="xs" color={COLORS.gray200} darkColor={COLORS.gray300} textColor={COLORS.gray600}>{t.needsPractice}</Button3D>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {signMastery.map((s) => {
              const borderColor = s.accuracy >= 80 ? COLORS.green : s.accuracy >= 50 ? COLORS.yellow : COLORS.gray200
              return (
                <Card3D key={s.sign} color={borderColor} padding="p-3" className="text-center">
                  <p className="text-2xl font-black" style={{ color: COLORS.gray800 }}>{s.sign}</p>
                  <p className="text-xs font-bold mt-1" style={{ color: COLORS.gray500 }}>{lang === 'ko' ? s.nameKo : s.name}</p>
                  <ProgressBar progress={s.accuracy} color={borderColor} height="h-1.5" className="mt-2" />
                  <p className="text-[10px] font-extrabold mt-1" style={{ color: borderColor }}>
                    {s.accuracy > 0 ? `${s.accuracy}%` : t.notStarted}
                  </p>
                </Card3D>
              )
            })}
          </div>
        </Card3D>
      </div>

      <div className="text-center py-4">
        <HandMascot size={56} mood="neutral" />
        <p className="text-sm font-bold mt-3" style={{ color: COLORS.gray400 }}>{t.buildStats}</p>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
