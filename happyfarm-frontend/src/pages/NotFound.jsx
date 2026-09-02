import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { C, LeafMark, btnPrimary } from '../theme/hf.jsx'

const NotFound = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page p-6">
      <div className="relative text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-meadow-700 shadow-e1">
          <LeafMark size={30} color={C.meadow100} />
        </span>
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
