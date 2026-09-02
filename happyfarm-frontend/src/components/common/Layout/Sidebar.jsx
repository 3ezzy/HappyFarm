import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { Icon } from '../../../theme/icons.jsx'

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
