import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, BookOpen, Target, BarChart3, Settings, Star, PanelRightClose, PanelRightOpen, Video, HelpCircle } from 'lucide-react'
import { COLORS } from '@/design-system/colors'
import { SidebarItem, MissionCard, LeaderboardRow } from '@/design-system/components'
import { FlameSVG } from '@/design-system/icons'
import useAuth from '@/hooks/useAuth'
import { signOut } from '@/services/auth'
import useLanguage from '@/stores/useLanguage'
import OnboardingTour from './OnboardingTour'
import { preloadRecordedSigns } from '@/services/signStorage'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
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
        <div className="mt-auto flex flex-col gap-1">
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
            <SidebarItem icon={Settings} label={t.logout} active={false} onClick={signOut} />
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
          <div className="flex items-center gap-4 mr-auto">
            <div className="flex items-center gap-1.5">
              <FlameSVG size={20} />
              <span className="font-black" style={{ color: COLORS.orange }}>0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star size={16} fill={COLORS.yellow} stroke={COLORS.yellowDark} />
              <span className="font-black" style={{ color: COLORS.yellow }}>0 XP</span>
            </div>
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
                <div className="space-y-2 mb-6">
                  <MissionCard icon={<Target size={16} color={COLORS.blue} />} title={lang === 'ko' ? '수어 3개 연습' : 'Practice 3 signs'} progress={0} target={3} xp={15} />
                  <MissionCard icon={<FlameSVG size={16} />} title={lang === 'ko' ? '5분 연습' : '5-min session'} progress={0} target={1} xp={10} />
                </div>

                <h3 className="font-extrabold text-sm mb-3" style={{ color: COLORS.gray800 }}>
                  {lang === 'ko' ? '리더보드' : 'Leaderboard'}
                </h3>
                <div>
                  <LeaderboardRow rank={1} name="SignMaster" xp={2450} />
                  <LeaderboardRow rank={2} name="HandsTalking" xp={1820} />
                  <LeaderboardRow rank={3} name="KSLearner" xp={1340} />
                </div>
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
