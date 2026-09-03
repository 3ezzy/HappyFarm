import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { btnPrimary } from '../theme/hf.jsx'
import { Mark } from '../theme/logo.jsx'

const NotFound = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page p-6">
      <div className="relative text-center">
        <Mark size={44} className="mx-auto mb-4" />
        <h1 className="mb-1 text-[64px]">{t('notFound.title')}</h1>
        <h2 className="mb-2 text-2xl">{t('notFound.subtitle')}</h2>
        <p className="mb-6 text-ink-500">{t('notFound.body')}</p>
        <button onClick={() => navigate('/')} className={btnPrimary}>
          {t('notFound.goHome')} <span className="text-lg rtl:rotate-180">→</span>
        </button>
      </div>
    </div>
  )
}

export default NotFound
