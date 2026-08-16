import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'
import ar from './locales/ar.json'

export const LANGUAGES = {
  en: { label: 'English', dir: 'ltr' },
  fr: { label: 'Français', dir: 'ltr' },
  ar: { label: 'العربية', dir: 'rtl' },
}

const STORAGE_KEY = 'hf-language'

const storedLanguage = (() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored && LANGUAGES[stored] ? stored : null
  } catch {
    return null
  }
})()

const browserLanguage = (navigator.language || 'en').slice(0, 2)
const initialLanguage = storedLanguage || (LANGUAGES[browserLanguage] ? browserLanguage : 'en')

export function applyDirection(language) {
  const dir = LANGUAGES[language]?.dir || 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = language
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

i18n.on('languageChanged', (language) => {
  applyDirection(language)
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // localStorage unavailable (private browsing, etc.) — language choice
    // just won't persist across reloads.
  }
})

applyDirection(initialLanguage)

export default i18n
