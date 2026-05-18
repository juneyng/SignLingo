import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Target, BarChart3, Settings, Star, PanelRightClose, PanelRightOpen, Video, HelpCircle, Zap, Brain } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { SidebarItem, LeaderboardRow } from '@/design-system/components'
import DailyMissionCard from './DailyMissionCard'
import { fetchLeaderboard } from '@/services/api'
import { FlameSVG } from '@/design-system/icons'
import useAuth from '@/hooks/useAuth'
import useProgress from '@/hooks/useProgress'
import { signOut } from '@/services/auth'
import useLanguage from '@/stores/useLanguage'
import OnboardingTour from './OnboardingTour'
import { preloadRecordedSigns } from '@/services/signStorage'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { row: progress, level } = useProgress()
  const { t, lang, toggle } = useLanguage()
  const [rightPanelOpen, setRightPanelOpen] = useState(true)

  // Preload sign recordings from Supabase once on mount
  useEffect(() => { preloadRecordedSigns() }, [])

  const navItems = [
    { path: '/', label: t.navHome, icon: Home },
    { path: '/lessons', label: t.navLessons, icon: BookOpen },
    { path: '/missions', label: t.navMissions, icon: Target },
    { path: '/dashboard', label: t.navStats, icon: BarChart3 },
    { path: '/record', label: lang === 'ko' ? '녹화' : 'Record', icon: Video },
  ]

  const isFullWidth = location.pathname.startsWith('/lessons/')

  return (
    <div className="min-h-screen flex" style={{ background: COLORS.bg }}>
      <OnboardingTour />
      {/* Left Sidebar */}
      <aside
        className="hidden md:flex flex-col items-center py-6 px-2 gap-1 sticky top-0 h-screen flex-shrink-0"
        style={{ width: 76, borderRight: `2px solid ${COLORS.gray200}`, background: COLORS.white }}
      >
        <div className="mb-6 cursor-pointer" onClick={() => navigate('/')}>
          <span className="text-xl font-black" style={{ color: COLORS.green }}>SL</span>
        </div>
        {navItems.map((item) => {
          const tourId = item.path === '/record' ? 'nav-record'
            : item.path === '/lessons' ? 'nav-lessons'
            : null
          return (
            <div key={item.path} data-tour={tourId || undefined} className="w-full">
              <SidebarItem
                icon={item.icon}
                label={item.label}
                active={item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)}
                onClick={() => navigate(item.path)}
              />
            </div>
          )
        })}
        <div className="mt-auto flex flex-col gap-1 items-center">
          <SidebarItem
            icon={HelpCircle}
            label={lang === 'ko' ? '가이드' : 'Help'}
            active={false}
            onClick={() => {
              localStorage.removeItem('signlingo_onboarding_completed')
              window.dispatchEvent(new Event('signlingo:replay-tour'))
            }}
          />
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              title={user.email || user.user_metadata?.full_name}
              className="w-12 h-12 rounded-full flex items-center justify-center font-black text-base cursor-pointer transition-all hover:scale-110 mt-1"
              style={{
                background: location.pathname.startsWith('/dashboard') ? COLORS.purple : `${COLORS.purple}25`,
                color: location.pathname.startsWith('/dashboard') ? 'white' : COLORS.purple,
                border: `2px solid ${COLORS.purple}40`,
              }}
            >
              {(user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()}
            </button>
          ) : (
            <SidebarItem icon={Settings} label={t.login} active={false} onClick={() => navigate('/login')} />
          )}
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header
          className="flex items-center justify-end gap-4 px-6 py-3 sticky top-0 z-30"
          style={{ background: COLORS.white, borderBottom: `2px solid ${COLORS.gray200}` }}
        >
          <div className="flex items-center gap-3 mr-auto">
            <HudStat
              icon={<FlameSVG size={18} />}
              value={progress?.streak ?? 0}
              color={COLORS.orange}
              dimmed={!user}
              title={lang === 'ko' ? '연속 출석' : 'Streak'}
            />
            <HudStat
              icon={<Star size={16} fill={COLORS.yellow} stroke={COLORS.yellowDark} strokeWidth={2.5} />}
              value={progress?.stars ?? 0}
              color={COLORS.yellow}
              dimmed={!user}
              title={lang === 'ko' ? '스타' : 'Stars'}
            />
            <LevelBadge level={level.level} progress={level.progress} dimmed={!user} />
          </div>

          {/* KO | EN Toggle */}
          <button
            data-tour="lang-toggle"
            onClick={toggle}
            className="flex items-center rounded-xl overflow-hidden cursor-pointer"
            style={{ border: `2px solid ${COLORS.gray200}` }}
          >
            <span className="px-3 py-1 text-xs font-black transition-all"
              style={{ background: lang === 'ko' ? COLORS.green : 'transparent', color: lang === 'ko' ? 'white' : COLORS.gray400 }}>KO</span>
            <span className="px-3 py-1 text-xs font-black transition-all"
              style={{ background: lang === 'en' ? COLORS.green : 'transparent', color: lang === 'en' ? 'white' : COLORS.gray400 }}>EN</span>
          </button>

          {/* Right panel toggle (hidden on full-width pages) */}
          {!isFullWidth && (
            <button
              onClick={() => setRightPanelOpen((v) => !v)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl cursor-pointer hover:scale-110 transition-transform"
              style={{ background: COLORS.gray100 }}
            >
              {rightPanelOpen
                ? <PanelRightClose size={16} color={COLORS.gray500} strokeWidth={2.5} />
                : <PanelRightOpen size={16} color={COLORS.gray500} strokeWidth={2.5} />
              }
            </button>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 flex">
          <main className="flex-1 px-6 py-6 mx-auto w-full max-w-5xl">
            <Outlet />
          </main>

          {/* Right Panel — collapsible */}
          {!isFullWidth && (
            <aside
              className={`hidden lg:flex flex-col sticky top-[57px] h-[calc(100vh-57px)] flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out`}
              style={{
                width: rightPanelOpen ? 300 : 0,
                borderLeft: rightPanelOpen ? `2px solid ${COLORS.gray200}` : 'none',
                background: COLORS.white,
                opacity: rightPanelOpen ? 1 : 0,
              }}
            >
              <div className="py-6 px-5 overflow-y-auto flex-1" style={{ minWidth: 300 }}>
                <h3 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>{t.dailyMissions}</h3>
                <DailyMissionList lang={lang} compact />
                <div className="h-6" />

                <h3 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
                  {lang === 'ko' ? '리더보드' : 'Leaderboard'}
                </h3>
                <LiveLeaderboard currentUserId={user?.id} lang={lang} />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2 z-50"
        style={{ background: COLORS.white, borderTop: `2px solid ${COLORS.gray200}` }}
      >
        {navItems.map((item) => {
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer">
              <item.icon size={20} strokeWidth={2.5} color={active ? COLORS.green : COLORS.gray400} />
              <span className="text-[10px] font-extrabold" style={{ color: active ? COLORS.green : COLORS.gray400 }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export function DailyMissionList({ lang, compact = false }) {
  const { row: progress } = useProgress()
  const missions = progress?.daily_missions || {}
  const claimed = new Set(missions.claimed || [])

  const items = [
    {
      key: 'signs',
      icon: <Target size={14} color={COLORS.blue} strokeWidth={2.5} />,
      title: lang === 'ko' ? '수어 3개 연습' : 'Practice 3 signs',
      progress: Math.min(3, Number(missions.signs_practiced) || 0),
      target: 3,
      xp: 30,
      stars: 5,
      completed: (Number(missions.signs_practiced) || 0) >= 3,
    },
    {
      key: 'challenge',
      icon: <Zap size={14} color={COLORS.orange} strokeWidth={2.5} />,
      title: lang === 'ko' ? '지문자 챌린지 1회' : 'Fingerspelling challenge',
      progress: missions.challenge_done ? 1 : 0,
      target: 1,
      xp: 25,
      stars: 5,
      completed: !!missions.challenge_done,
    },
    {
      key: 'quiz',
      icon: <Brain size={14} color={COLORS.purple} strokeWidth={2.5} />,
      title: lang === 'ko' ? '퀴즈 1세션' : 'Complete a quiz',
      progress: missions.quiz_done ? 1 : 0,
      target: 1,
      xp: 25,
      stars: 10,
      completed: !!missions.quiz_done,
    },
  ]

  return (
    <div className="space-y-2">
      {items.map((m) => (
        <DailyMissionCard
          key={m.key}
          missionKey={m.key}
          icon={m.icon}
          title={m.title}
          progress={m.progress}
          target={m.target}
          xp={m.xp}
          stars={m.stars}
          isCompleted={m.completed}
          isClaimed={claimed.has(m.key)}
          compact={compact}
        />
      ))}
    </div>
  )
}

function LiveLeaderboard({ currentUserId, lang }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const { row: progress } = useProgress()

  useEffect(() => {
    let cancelled = false
    fetchLeaderboard()
      .then((data) => {
        if (!cancelled) setRows(data || [])
      })
      .catch((e) => console.warn('[Leaderboard] fetch failed:', e.message))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // Re-fetch when the user's own XP changes (rough trigger)
  }, [progress?.xp])

  if (loading && rows.length === 0) {
    return (
      <p className="text-xs font-bold py-3 text-center" style={{ color: COLORS.gray400 }}>
        {lang === 'ko' ? '불러오는 중...' : 'Loading...'}
      </p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="text-xs font-bold py-3 text-center" style={{ color: COLORS.gray400 }}>
        {lang === 'ko' ? '아직 데이터가 없어요' : 'No data yet'}
      </p>
    )
  }

  return (
    <div>
      {rows.slice(0, 10).map((r, i) => {
        const name = r.profiles?.display_name
          || (lang === 'ko' ? '익명' : 'Anon')
        const xp = r.xp ?? r.total_points ?? 0
        return (
          <LeaderboardRow
            key={r.user_id}
            rank={i + 1}
            name={name}
            xp={xp}
            isMe={r.user_id === currentUserId}
          />
        )
      })}
    </div>
  )
}

function HudStat({ icon, value, color, dimmed = false, title }) {
  return (
    <div
      title={title}
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-opacity"
      style={{ opacity: dimmed ? 0.4 : 1 }}
    >
      {icon}
      <span className="text-sm font-black" style={{ color }}>{value}</span>
    </div>
  )
}

function LevelBadge({ level, progress, dimmed = false }) {
  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1 rounded-lg transition-opacity"
      style={{
        opacity: dimmed ? 0.4 : 1,
        background: `${COLORS.purple}15`,
        border: `2px solid ${COLORS.purple}40`,
      }}
      title="Level"
    >
      <span className="text-xs font-black" style={{ color: COLORS.purple }}>Lv{level}</span>
      <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: `${COLORS.purple}30` }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.round(progress * 100)}%`, background: COLORS.purple }}
        />
      </div>
    </div>
  )
}
