import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { C, LeafMark } from '../theme/hf.jsx'

const NotFound = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <div className="hf-leaf-bg flex min-h-screen items-center justify-center bg-pageBg p-6">
      <div className="relative text-center">
        <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green shadow-ribbon">
          <LeafMark size={30} color={C.leafPale} />
        </span>
        <h1 className="mb-1 text-[64px]">{t('notFound.title')}</h1>
        <h2 className="mb-2 text-2xl">{t('notFound.subtitle')}</h2>
        <p className="mb-6 text-tan">{t('notFound.body')}</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full border-none bg-brown px-6 py-3 font-display text-[15px] font-bold text-white shadow-soft transition-all duration-200 ease-pop hover:scale-[1.03] hover:bg-brown-dark"
        >
          {t('notFound.goHome')} <span className="text-lg rtl:rotate-180">→</span>
        </button>
      </div>
    </div>
  )
}

export default NotFound
