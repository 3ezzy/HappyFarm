import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { initialsOf } from '../../../theme/hf.jsx'
import { Logo } from '../../../theme/logo.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'

const Topbar = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, farm } = useAuth()

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-line bg-surface-card px-4 nav:px-6">
      <button
        onClick={() => navigate('/')}
        className="flex cursor-pointer items-center gap-2.5 border-none bg-transparent"
      >
        <Logo size={28} textClassName="text-lg" />
        {farm?.name && (
          <span className="hidden truncate text-sm text-ink-500 sm:inline">· {farm.name}</span>
        )}
      </button>

      <div className="flex items-center gap-2.5">
        <LanguageSwitcher />
        <button
          onClick={() => navigate('/profile')}
          title={t('nav.profile')}
          className="h-10 w-10 cursor-pointer rounded-full border-none bg-meadow-700 font-display text-sm font-semibold text-white transition-colors duration-hf hover:bg-meadow-900"
        >
          {initialsOf(user?.name)}
        </button>
      </div>
    </header>
  )
}

export default Topbar
