import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Logo } from '../../theme/logo.jsx'
import { cardClass, btnPrimary, btnGhost } from '../../theme/hf.jsx'
import { Icon } from '../../theme/icons.jsx'
import LanguageSwitcher from '../../components/common/Layout/LanguageSwitcher.jsx'

const FEATURES = ['animals', 'care', 'eligibility', 'breeding', 'health', 'weight', 'alerts']

const HIGHLIGHTS = [
  { key: 'animals', icon: Icon.animals },
  { key: 'care', icon: Icon.feed },
  { key: 'eligibility', icon: Icon.eligible },
  { key: 'breeding', icon: Icon.breedingCheck },
  { key: 'health', icon: Icon.healthDue },
  { key: 'alerts', icon: Icon.bell },
]

const STEPS = ['step1', 'step2', 'step3']

/**
 * Public landing page — what a visitor sees before logging in. Root path
 * (`/`) stays the protected dashboard (unchanged); this lives at its own
 * route so nothing about the existing authenticated app's routing moves.
 * Every claim in "what HappyFarm does" maps to a feature that actually
 * exists in the app today (Animals, care actions, sacrifice eligibility,
 * breeding/births, health records, weight history, alerts) — nothing
 * aspirational.
 */
const Landing = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-surface-page">
      <header className="border-b border-line bg-surface-card">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-5 nav:px-8">
          <Logo size={26} />
          <div className="flex items-center gap-2.5">
            <LanguageSwitcher />
            <button onClick={() => navigate('/login')} className={btnGhost}>
              {t('auth.login')}
            </button>
            <button onClick={() => navigate('/register')} className={btnPrimary}>
              {t('landing.getStarted')}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-content px-5 py-16 text-center nav:px-8 nav:py-24">
          <div className="mb-6 flex justify-center">
            <Logo size={56} textClassName="text-2xl" />
          </div>
          <p className="mb-3 font-mono text-caption uppercase text-ink-500">{t('landing.heroEyebrow')}</p>
          <h1 className="mx-auto max-w-[18ch] font-display text-d1 font-semibold leading-tight text-ink-900">
            {t('landing.heroTitle')}
          </h1>
          <p className="mx-auto mt-5 max-w-[52ch] text-lg leading-relaxed text-ink-500">
            {t('landing.heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <button onClick={() => navigate('/register')} className={`${btnPrimary} px-8 py-3 text-base`}>
              {t('landing.getStarted')}
            </button>
            <p className="text-sm text-ink-500">
              {t('landing.heroSecondary')}{' '}
              <button onClick={() => navigate('/login')} className="font-medium text-meadow-700 hover:text-meadow-900">
                {t('auth.login')}
              </button>
            </p>
          </div>
        </section>

        {/* What HappyFarm does */}
        <section className="mx-auto max-w-content px-5 py-14 nav:px-8">
          <div className="mx-auto max-w-[64ch] text-center">
            <h2 className="font-display text-h1 font-semibold text-ink-900">{t('landing.whatTitle')}</h2>
            <p className="mt-3 text-ink-500">{t('landing.whatIntro')}</p>
          </div>
          <ul className="mx-auto mt-10 grid max-w-[70ch] gap-4 sm:grid-cols-2">
            {FEATURES.map((key) => (
              <li key={key} className="flex items-start gap-3 text-start">
                <Icon.eligible width={18} height={18} className="mt-1 flex-none text-ok-fg" />
                <span className="text-[15px] leading-relaxed text-ink-700">{t(`landing.features.${key}`)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section className="border-y border-line bg-surface-card">
          <div className="mx-auto max-w-content px-5 py-14 nav:px-8">
            <h2 className="text-center font-display text-h1 font-semibold text-ink-900">{t('landing.howTitle')}</h2>
            <div className="mx-auto mt-10 grid max-w-[80ch] gap-6 sm:grid-cols-3">
              {STEPS.map((key, i) => (
                <div key={key} className="text-center">
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-meadow-100 font-display text-sm font-semibold text-meadow-900">
                    {i + 1}
                  </div>
                  <h3 className="font-display text-base font-semibold text-ink-900">{t(`landing.howSteps.${key}Title`)}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{t(`landing.howSteps.${key}Body`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature highlights */}
        <section className="mx-auto max-w-content px-5 py-14 nav:px-8">
          <h2 className="text-center font-display text-h1 font-semibold text-ink-900">{t('landing.highlightsTitle')}</h2>
          <div className="mx-auto mt-10 grid max-w-[900px] gap-4 sm:grid-cols-2 nav:grid-cols-3">
            {HIGHLIGHTS.map(({ key, icon: HighlightIcon }) => (
              <div key={key} className={`${cardClass} flex items-center gap-3 border border-line p-4`}>
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded bg-meadow-50 text-meadow-700">
                  <HighlightIcon width={20} height={20} />
                </span>
                <span className="font-display text-[15px] font-medium text-ink-900">{t(`landing.highlights.${key}`)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-meadow-900">
          <div className="mx-auto max-w-content px-5 py-16 text-center nav:px-8">
            <h2 className="font-display text-h1 font-semibold text-white">{t('landing.finalTitle')}</h2>
            <p className="mx-auto mt-3 max-w-[48ch] text-meadow-100">{t('landing.finalSubtitle')}</p>
            <button
              onClick={() => navigate('/register')}
              className="mt-7 inline-flex cursor-pointer items-center justify-center gap-2 rounded bg-white px-8 py-3 text-base font-medium text-meadow-900 transition-colors duration-hf hover:bg-meadow-50"
            >
              {t('landing.getStarted')}
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-content flex-col items-center gap-3 px-5 py-8 text-center nav:flex-row nav:justify-between nav:text-start">
          <div className="flex items-center gap-2">
            <Logo size={18} textClassName="text-sm" />
          </div>
          <p className="text-xs text-ink-500">{t('landing.footerTagline')}</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
