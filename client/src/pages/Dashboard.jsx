import { Star, BookOpen, Target, Heart, Zap, Trophy, LogOut } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { Card3D, StatCard, ProgressBar, Badge, Button3D, ButtonOutline } from '@/design-system/components'
import { FlameSVG, HandMascot } from '@/design-system/icons'
import useLanguage from '@/stores/useLanguage'
import useAuth from '@/hooks/useAuth'
import useProgress from '@/hooks/useProgress'
import { signOut } from '@/services/auth'
import { xpForNext } from '@/utils/leveling'

const DAILY_CAP = 800

export default function Dashboard() {
  const { t, lang } = useLanguage()
  const { user } = useAuth()
  const { row: progress, level, loading } = useProgress()

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || user?.email?.split('@')[0]
    || (lang === 'ko' ? '게스트' : 'Guest')
  const email = user?.email
  const initial = displayName?.charAt(0).toUpperCase() || '?'

  const xp = progress?.xp ?? 0
  const stars = progress?.stars ?? 0
  const hearts = progress?.hearts ?? 0
  const streak = progress?.streak ?? 0
  const dailyXp = progress?.daily_xp ?? 0
  const dailyProgress = Math.min(1, dailyXp / DAILY_CAP)
  const tierLabel = level.level >= 10 ? (lang === 'ko' ? '숙련자' : 'Expert')
    : level.level >= 5 ? (lang === 'ko' ? '중급자' : 'Intermediate')
    : (lang === 'ko' ? '초심자' : 'Beginner')

  return (
    <div className="space-y-5 animate-[fadeIn_0.6s_ease]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: COLORS.gray800 }}>{t.myProgress}</h1>
          <p className="text-sm font-semibold mt-1" style={{ color: COLORS.gray400 }}>{t.trackJourney}</p>
        </div>
        {user && (
          <ButtonOutline
            color={COLORS.gray400}
            size="sm"
            icon={<LogOut size={14} />}
            onClick={signOut}
          >
            {t.logout}
          </ButtonOutline>
        )}
      </div>

      {/* Login prompt */}
      {!user && !loading && (
        <Card3D color={COLORS.blue} padding="p-5">
          <div className="flex items-center gap-3">
            <HandMascot size={48} mood="excited" />
            <div className="flex-1">
              <p className="font-black text-base" style={{ color: COLORS.gray800 }}>
                {lang === 'ko' ? '로그인하면 진도가 저장됩니다' : 'Sign in to save your progress'}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: COLORS.gray500 }}>
                {lang === 'ko' ? 'XP·스타·연속 출석을 영구 기록하세요.' : 'Keep your XP, stars, and streak across devices.'}
              </p>
            </div>
          </div>
        </Card3D>
      )}

      {/* Profile + Currency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <Card3D color={COLORS.purple} padding="p-5">
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-black text-xl shrink-0"
              style={{ background: COLORS.purpleBg || `${COLORS.purple}20`, color: COLORS.purple }}
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-black text-base truncate" style={{ color: COLORS.gray800 }}>{displayName}</h2>
              {email && (
                <p className="text-[11px] font-semibold truncate" style={{ color: COLORS.gray400 }}>{email}</p>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <Badge color={COLORS.purple}>Lv {level.level}</Badge>
                <span className="text-[10px] font-bold" style={{ color: COLORS.gray400 }}>{tierLabel}</span>
              </div>
            </div>
          </div>

          {/* Level progress */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-extrabold" style={{ color: COLORS.purple }}>
                {lang === 'ko' ? '다음 레벨까지' : 'Next level'}
              </span>
              <span className="text-[11px] font-black" style={{ color: COLORS.gray500 }}>
                {level.xpInLevel} / {level.xpForNext} XP
              </span>
            </div>
            <ProgressBar progress={Math.round(level.progress * 100)} color={COLORS.purple} height="h-2" />
          </div>
        </Card3D>

        {/* Currency grid */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<Zap size={18} color={COLORS.yellow} strokeWidth={2.5} fill={COLORS.yellow} />}
            value={xp.toLocaleString()}
            label={t.totalXP || (lang === 'ko' ? '총 XP' : 'Total XP')}
            color={COLORS.yellow}
          />
          <StatCard
            icon={<Star size={18} fill={COLORS.yellow} stroke={COLORS.yellowDark} strokeWidth={2.5} />}
            value={stars.toLocaleString()}
            label={lang === 'ko' ? '스타' : 'Stars'}
            color={COLORS.yellow}
          />
          <StatCard
            icon={<Heart size={18} fill={hearts > 0 ? COLORS.red : 'none'} stroke={COLORS.red} strokeWidth={2.5} />}
            value={`${hearts}/5`}
            label={lang === 'ko' ? '하트' : 'Hearts'}
            color={COLORS.red}
          />
          <StatCard
            icon={<FlameSVG size={20} />}
            value={streak.toString()}
            label={t.dayStreak || (lang === 'ko' ? '연속 출석' : 'Day streak')}
            color={COLORS.orange}
          />
        </div>
      </div>

      {/* Daily XP progress */}
      <Card3D color={COLORS.gray200} padding="p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target size={16} color={COLORS.green} strokeWidth={2.5} />
            <span className="text-sm font-extrabold" style={{ color: COLORS.gray800 }}>
              {lang === 'ko' ? '오늘의 XP 진행' : 'Today’s XP'}
            </span>
          </div>
          <span className="text-sm font-black" style={{ color: COLORS.green }}>
            {dailyXp.toLocaleString()} / {DAILY_CAP}
          </span>
        </div>
        <ProgressBar progress={Math.round(dailyProgress * 100)} color={COLORS.green} height="h-3" />
        <p className="text-[11px] font-bold mt-2" style={{ color: COLORS.gray400 }}>
          {dailyXp >= DAILY_CAP
            ? (lang === 'ko' ? '오늘 상한 도달! 추가 XP는 50% 만 적립됩니다.' : 'Daily cap reached — XP earned past this point is reduced by 50%.')
            : (lang === 'ko' ? `상한까지 ${DAILY_CAP - dailyXp} XP 남았어요.` : `${DAILY_CAP - dailyXp} XP until cap.`)}
        </p>
      </Card3D>

      {/* Achievements + Next milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card3D color={COLORS.gray200} padding="p-5">
          <h3 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
            <Trophy size={14} className="inline mr-1" color={COLORS.yellow} strokeWidth={2.5} />
            {lang === 'ko' ? '다음 목표' : 'Next milestones'}
          </h3>
          <div className="space-y-2.5">
            <MilestoneRow
              label={lang === 'ko' ? `레벨 ${level.level + 1} 도달` : `Reach level ${level.level + 1}`}
              current={level.xpInLevel}
              target={level.xpForNext}
              color={COLORS.purple}
              unit="XP"
            />
            <MilestoneRow
              label={lang === 'ko' ? '7일 연속 출석' : '7-day streak'}
              current={streak}
              target={7}
              color={COLORS.orange}
              unit={lang === 'ko' ? '일' : 'days'}
            />
            <MilestoneRow
              label={lang === 'ko' ? '스타 200개' : '200 stars'}
              current={stars}
              target={200}
              color={COLORS.yellow}
              unit="★"
            />
          </div>
        </Card3D>

        <Card3D color={COLORS.gray200} padding="p-5">
          <h3 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
            {lang === 'ko' ? '계정 정보' : 'Account info'}
          </h3>
          <div className="space-y-2 text-xs">
            <InfoRow label={lang === 'ko' ? '이름' : 'Name'} value={displayName} />
            {email && <InfoRow label="Email" value={email} />}
            <InfoRow
              label={lang === 'ko' ? '가입일' : 'Joined'}
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            />
            <InfoRow
              label={lang === 'ko' ? '최근 출석' : 'Last login'}
              value={progress?.last_login_date || '—'}
            />
          </div>
        </Card3D>
      </div>

      <div className="text-center py-4">
        <HandMascot size={56} mood={xp > 0 ? 'excited' : 'neutral'} />
        <p className="text-sm font-bold mt-3" style={{ color: COLORS.gray400 }}>
          {xp > 0
            ? (lang === 'ko' ? `벌써 ${xp.toLocaleString()} XP를 모았어요!` : `You’ve earned ${xp.toLocaleString()} XP so far!`)
            : (t.buildStats || (lang === 'ko' ? '레슨을 시작해 통계를 쌓아보세요.' : 'Start a lesson to build your stats.'))}
        </p>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}

function MilestoneRow({ label, current, target, color, unit }) {
  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100))
  const done = current >= target
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold" style={{ color: COLORS.gray700 }}>
          {done && '✓ '}{label}
        </span>
        <span className="text-[11px] font-black" style={{ color: done ? COLORS.green : color }}>
          {current.toLocaleString()} / {target.toLocaleString()} {unit}
        </span>
      </div>
      <ProgressBar progress={pct} color={done ? COLORS.green : color} height="h-1.5" />
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold" style={{ color: COLORS.gray400 }}>{label}</span>
      <span className="font-black truncate text-right" style={{ color: COLORS.gray700 }}>{value}</span>
    </div>
  )
}
