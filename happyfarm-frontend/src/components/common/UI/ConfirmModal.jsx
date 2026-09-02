import { useTranslation } from 'react-i18next'
import { Icon } from '../../../theme/icons.jsx'

/**
 * Shared confirm/cancel modal — used by every delete/destructive-action
 * flow (weights, breeding cycles, births, health records, animals, and —
 * once migrated — the sacrifice confirmation on AnimalDetails) so they all
 * look and behave identically.
 */
const ConfirmModal = ({
  title, body, confirmLabel, loadingLabel, onConfirm, onCancel, isConfirming = false, tone = 'danger',
}) => {
  const { t } = useTranslation()

  const iconBg = tone === 'danger' ? 'bg-danger-bg' : 'bg-warn-bg'
  const iconColor = tone === 'danger' ? 'text-danger-fg' : 'text-warn-fg'
  const confirmBtnClass =
    tone === 'danger'
      ? 'bg-danger-fg enabled:hover:brightness-90'
      : 'bg-meadow-700 enabled:hover:bg-meadow-900'

  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-5 backdrop-blur-[3px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] overflow-hidden rounded-lg border border-line bg-surface-card shadow-e3"
      >
        <div className="px-7 pb-2 pt-7 text-center">
          <div className={`mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
            <Icon.warning width={26} height={26} />
          </div>
          <h3 className="mb-2 text-2xl text-ink-900">{title}</h3>
          {body && <p className="mx-6 text-[15px] leading-relaxed text-ink-500">{body}</p>}
        </div>
        <div className="flex gap-3 px-7 py-6">
          <button
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded border border-line-strong bg-surface-card p-3 text-[15px] font-medium text-ink-900 transition-colors duration-hf hover:bg-surface-sunken"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`flex-1 cursor-pointer rounded border-none p-3 text-[15px] font-medium text-white transition-colors duration-hf disabled:cursor-not-allowed disabled:opacity-45 ${confirmBtnClass}`}
          >
            {isConfirming ? (loadingLabel || t('common.saving')) : (confirmLabel || t('common.confirm'))}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
