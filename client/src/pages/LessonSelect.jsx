import { useNavigate } from 'react-router-dom'
import { ChevronRight, HandMetal, Users, Smile, Hash, Heart, Home as HomeIcon } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Card3D, PathNode, ProgressBar, ProgressRing, Badge } from '@/design-system/components'
import { UNITS, TOTAL_SIGNS } from '@/data/signDatabase'
import useLanguage from '@/stores/useLanguage'

const UNIT_ICONS = {
  greetings: Users,
  responses: Smile,
  intro: HomeIcon,
  emotions: Heart,
  numbers: Hash,
  family: Users,
  daily: HandMetal,
}

const UNIT_COLORS = [
  COLORS.green, COLORS.blue, COLORS.purple, COLORS.orange,
  COLORS.yellow, COLORS.red, COLORS.green,
]

export default function LessonSelect() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  return (
    <div className="space-y-6 animate-[fadeIn_0.7s_ease]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => navigate('/')} className="text-xs font-bold cursor-pointer" style={{ color: COLORS.gray400 }}>{t.navHome}</button>
        <ChevronRight size={12} color={COLORS.gray300} />
        <span className="text-xs font-bold" style={{ color: COLORS.gray600 }}>{t.navLessons}</span>
      </div>

      <div>
        <h1 className="text-2xl font-black" style={{ color: COLORS.gray800 }}>{t.lessonSelectTitle}</h1>
        <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray400 }}>
          {TOTAL_SIGNS} {lang === 'ko' ? '개 수어' : 'signs'} · 7 {lang === 'ko' ? '단원' : 'units'}
        </p>
      </div>

      <Card3D color={COLORS.gray200} padding="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold" style={{ color: COLORS.gray600 }}>{t.overallProgress}</span>
          <span className="text-sm font-black" style={{ color: COLORS.green }}>0/{TOTAL_SIGNS}</span>
        </div>
        <ProgressBar progress={0} color={COLORS.green} />
      </Card3D>

      {/* Units */}
      {UNITS.map((unit, unitIdx) => {
        const Icon = UNIT_ICONS[unit.id] || HandMetal
        const color = UNIT_COLORS[unitIdx]
        const isFirst = unitIdx === 0

        return (
          <div key={unit.id} className="space-y-3">
            {/* Unit header */}
            <div className="flex items-center gap-3">
              <ProgressRing progress={0} size={44} strokeWidth={4} color={color} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm" style={{ color: COLORS.gray800 }}>
                    {t.unit} {unitIdx + 1}: {lang === 'ko' ? unit.titleKo : unit.titleEn}
                  </h3>
                  <Badge color={color}>
                    {unit.signs.length} {lang === 'ko' ? '개' : 'signs'}
                  </Badge>
                  {unit.signs.some((s) => s.poseLandmarks) && (
                    <Badge color={COLORS.blue}>{lang === 'ko' ? '팔 동작' : 'Arms'}</Badge>
                  )}
                </div>
                <p className="text-xs font-semibold" style={{ color: COLORS.gray400 }}>
                  {lang === 'ko' ? unit.descKo : unit.descEn}
                </p>
              </div>
            </div>

            {/* Path nodes — zigzag */}
            <div className="flex flex-col items-center gap-12 py-4">
              {unit.signs.map((sign, i) => (
                <PathNode
                  key={sign.id}
                  icon={<Icon size={28} strokeWidth={2.5} />}
                  title={sign.name_ko}
                  desc={sign.name_en}
                  status="current"
                  stars={0}
                  index={i}
                  total={unit.signs.length}
                  onStart={() => navigate(`/lessons/${unit.id}`)}
                />
              ))}
            </div>
          </div>
        )
      })}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
