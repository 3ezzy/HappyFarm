import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../../i18n/index.js'

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation()

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label={t('language.label')}
      className="h-11 cursor-pointer rounded border border-line-strong bg-surface-card px-3 font-sans text-sm font-medium text-ink-900 outline-none transition-colors duration-hf hover:border-ink-400 focus:border-meadow-700 focus:shadow-focus"
    >
      {Object.keys(LANGUAGES).map((code) => (
        <option key={code} value={code}>
          {LANGUAGES[code].label}
        </option>
      ))}
    </select>
  )
}

export default LanguageSwitcher
