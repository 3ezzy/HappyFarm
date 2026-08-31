import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'

/* Hand-drawn inline line icons, 20x20, matching the app's existing
   convention (LeafMark/AnimalIcon) rather than adding an icon-library
   dependency. */
const Icon = {
  overview: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  animals: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <circle cx="10" cy="12.2" r="3.3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="4.6" cy="7.4" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15.4" cy="7.4" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="4.8" r="1.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  farm: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M3 9.5 10 3.5l7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 8.5V16h11V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M8.3 16v-4.2h3.4V16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  reports: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M3.5 16.5v-5M9 16.5V6M14.5 16.5v-8.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  inventory: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M3 6.3 10 3l7 3.3-7 3.3-7-3.3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M3 6.3V14l7 3.2V9.6M17 6.3V14l-7 3.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  ),
  profile: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.8 16.5c1-3 3.4-4.5 6.2-4.5s5.2 1.5 6.2 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  admin: (p) => (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" {...p}>
      <path d="M10 2.8 16 5v4.4c0 4-2.6 6.9-6 8.1-3.4-1.2-6-4.1-6-8.1V5l6-2.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.4 10 9.2 11.8 12.8 8.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { key: 'overview', labelKey: 'nav.home', path: '/', icon: Icon.overview, exact: true },
  { key: 'animals', labelKey: 'nav.animals', path: '/animals', icon: Icon.animals },
  { key: 'farm', labelKey: 'nav.farm', path: '/farm', icon: Icon.farm },
  { key: 'reports', labelKey: 'nav.reports', path: '/reports', icon: Icon.reports },
  { key: 'inventory', labelKey: 'nav.inventory', path: '/inventory', icon: Icon.inventory },
  { key: 'profile', labelKey: 'nav.profile', path: '/profile', icon: Icon.profile },
  { key: 'admin', labelKey: 'nav.admin', path: '/admin', icon: Icon.admin, adminOnly: true },
]

const isActive = (pathname, item) => (item.exact ? pathname === item.path : pathname.startsWith(item.path))

const Sidebar = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'admin')

  return (
    <>
      {/* Desktop: fixed 240px rail. Logical inset-inline-start so RTL
          flips it to the right automatically. */}
      <nav
        aria-label={t('nav.home')}
        className="fixed start-0 top-16 hidden h-[calc(100vh-4rem)] w-sidebar flex-col gap-1 border-e border-line bg-surface-card p-3 nav:flex"
      >
        {items.map((item) => {
          const active = isActive(pathname, item)
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              className={classNames(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded border-none px-3 py-2.5 text-start font-sans text-sm font-medium transition-colors duration-hf',
                active ? 'bg-meadow-50 text-meadow-700' : 'bg-transparent text-ink-700 hover:bg-surface-sunken'
              )}
            >
              <item.icon />
              {t(item.labelKey)}
            </button>
          )
        })}
      </nav>

      {/* Mobile (<900px): bottom tab bar, same data. */}
      <nav
        aria-label={t('nav.home')}
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-line bg-surface-card nav:hidden"
      >
        {items.map((item) => {
          const active = isActive(pathname, item)
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              aria-current={active ? 'page' : undefined}
              className={classNames(
                'flex min-h-11 flex-1 cursor-pointer flex-col items-center gap-0.5 border-none bg-transparent py-2 font-sans text-[11px] font-medium transition-colors duration-hf',
                active ? 'text-meadow-700' : 'text-ink-500'
              )}
            >
              <item.icon />
              {t(item.labelKey)}
            </button>
          )
        })}
      </nav>
    </>
  )
}

export default Sidebar
