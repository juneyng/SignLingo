import { useNavigate } from 'react-router-dom'
import { ChevronRight, HandMetal, Users, Smile, Hash, Heart, Home as HomeIcon, Play, BookA, MessageCircle } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Card3D, ProgressBar, ProgressRing, Badge } from '@/design-system/components'
import { UNITS, TOTAL_SIGNS } from '@/data/signDatabase'
import useLanguage from '@/stores/useLanguage'

const UNIT_ICONS = {
  fingerspelling: BookA,
  greetings: Users,
  responses: Smile,
  intro: HomeIcon,
  emotions: Heart,
  numbers: Hash,
  family: Users,
  daily: HandMetal,
  etc: MessageCircle,
}

const UNIT_COLORS = [
  COLORS.purple, COLORS.green, COLORS.blue, COLORS.orange,
  COLORS.yellow, COLORS.red, COLORS.green, COLORS.blue, COLORS.purple,
]

export default function LessonSelect() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()

  return (
    <div className="space-y-6 animate-[fadeIn_0.7s_ease] pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <button onClick={() => navigate('/')} className="text-xs font-bold cursor-pointer" style={{ color: COLORS.gray400 }}>{t.navHome}</button>
        <ChevronRight size={12} color={COLORS.gray300} />
        <span className="text-xs font-bold" style={{ color: COLORS.gray600 }}>{t.navLessons}</span>
      </div>

      <div>
        <h1 className="text-2xl font-black" style={{ color: COLORS.gray800 }}>{t.lessonSelectTitle}</h1>
        <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray400 }}>
          {TOTAL_SIGNS} {lang === 'ko' ? '개 수어' : 'signs'} · {UNITS.length} {lang === 'ko' ? '단원' : 'units'}
        </p>
      </div>

      <Card3D color={COLORS.gray200} padding="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold" style={{ color: COLORS.gray600 }}>{t.overallProgress}</span>
          <span className="text-sm font-black" style={{ color: COLORS.green }}>0/{TOTAL_SIGNS}</span>
        </div>
        <ProgressBar progress={0} color={COLORS.green} />
      </Card3D>

      {/* Units — categorized grid */}
      <div className="space-y-5">
        {UNITS.map((unit, unitIdx) => {
          const Icon = UNIT_ICONS[unit.id] || HandMetal
          const color = UNIT_COLORS[unitIdx % UNIT_COLORS.length]

          return (
            <Card3D key={unit.id} color={color} padding="p-5">
              {/* Unit header */}
              <div className="flex items-center gap-3 mb-4">
                <ProgressRing progress={0} size={44} strokeWidth={4} color={color} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm" style={{ color: COLORS.gray800 }}>
                      {t.unit} {unitIdx + 1}: {lang === 'ko' ? unit.titleKo : unit.titleEn}
                    </h3>
                    <Badge color={color}>
                      {unit.signs.length} {lang === 'ko' ? '개' : 'signs'}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: COLORS.gray400 }}>
                    {lang === 'ko' ? unit.descKo : unit.descEn}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/lessons/${unit.id}`)}
                  className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform active:translate-y-[1px]"
                  style={{ background: color, color: 'white', borderBottom: `3px solid ${color}` }}
                >
                  <Play size={12} strokeWidth={3} />
                  {lang === 'ko' ? '시작' : 'Start'}
                </button>
              </div>

              {/* Sign grid — compact tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {unit.signs.map((sign) => (
                  <button
                    key={sign.id}
                    onClick={() => navigate(`/lessons/${unit.id}`)}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-white cursor-pointer transition-all hover:scale-[1.03] hover:shadow-md text-left"
                    style={{ border: `2px solid ${COLORS.gray200}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}22`, color }}
                    >
                      <Icon size={16} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black truncate" style={{ color: COLORS.gray800 }}>
                        {lang === 'ko' ? sign.name_ko : sign.name_en}
                      </p>
                      <p className="text-[10px] font-semibold truncate" style={{ color: COLORS.gray400 }}>
                        {lang === 'ko' ? sign.name_en : sign.name_ko}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card3D>
          )
        })}
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
