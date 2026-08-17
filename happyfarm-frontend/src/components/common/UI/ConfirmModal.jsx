import { useTranslation } from 'react-i18next'

/**
 * Shared confirm/cancel modal — same markup and animation as the sacrifice
 * confirmation on AnimalDetails, extracted so every delete flow (weights,
 * breeding cycles, births, health records) looks and behaves identically.
 */
const ConfirmModal = ({ title, body, confirmLabel, onConfirm, onCancel, isConfirming = false, tone = 'danger' }) => {
  const { t } = useTranslation()

  const iconBg = tone === 'danger' ? 'bg-red-soft' : 'bg-yellow-badgeBg'
  const confirmBtnClass =
    tone === 'danger'
      ? 'bg-red enabled:hover:bg-red-dark'
      : 'bg-green enabled:hover:bg-green-dark'

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex animate-hf-fade items-center justify-center bg-scrim p-5 backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] animate-hf-modal overflow-hidden rounded-2xl bg-cream shadow-card"
      >
        <div className="px-7 pb-2 pt-7 text-center">
          <div className={`mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full text-[26px] ${iconBg}`}>⚠️</div>
          <h3 className="mb-2 text-2xl">{title}</h3>
          {body && <p className="mx-6 text-[15px] leading-relaxed text-brown">{body}</p>}
        </div>
        <div className="flex gap-3 px-7 py-6">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-full border-2 border-line bg-cream p-3 font-display text-[15px] font-bold text-brown-text transition-transform duration-150 hover:scale-[1.03]"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex-1 cursor-pointer rounded-full border-none p-3 font-display text-[15px] font-bold text-white shadow-soft transition-all duration-150 enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 ${confirmBtnClass}`}
          >
            {isConfirming ? t('common.saving') : (confirmLabel || t('common.confirm'))}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
