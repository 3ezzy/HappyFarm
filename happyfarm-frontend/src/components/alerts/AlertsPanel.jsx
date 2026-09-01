import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { alertService } from '../../services/api/alerts.js'
import LoadingSpinner from '../common/UI/LoadingSpinner.jsx'
import { fmtDate, cardClass, AlertRow, EmptyState } from '../../theme/hf.jsx'
import { Icon } from '../../theme/icons.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const TYPE_ICON = {
  breeding_check_due: Icon.breedingCheck,
  lambing_due: Icon.lambing,
  weaning_due: Icon.weaning,
  reinsemination_due: Icon.reinsemination,
  health_due: Icon.healthDue,
  low_stock: Icon.archived,
}

const smBtnBase =
  'inline-flex cursor-pointer items-center justify-center gap-1.5 rounded border px-3 py-[5px] ' +
  'text-[13px] font-medium transition-colors duration-hf disabled:cursor-not-allowed disabled:opacity-45'
const smBtnOutline = `${smBtnBase} border-line-strong bg-surface-card text-ink-900 hover:bg-surface-sunken`
const smBtnGhost = `${smBtnBase} border-transparent bg-transparent text-ink-500 hover:text-ink-900`

/**
 * Alerts are computed on the backend at read time (see AlertGenerator) —
 * there is no scheduler/queue, so this panel just fetches the current list
 * whenever it's mounted or the window regains focus, same polling
 * convention as the Animals list. It builds every sentence from the
 * structured `type` + fields the API returns; it never receives or shows
 * a server-rendered string.
 */
const AlertsPanel = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery('alerts', alertService.getAll, {
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  const dismissMutation = useMutation((key) => alertService.dismiss(key), {
    onSuccess: async () => {
      await queryClient.invalidateQueries('alerts')
      toast.success(t('alerts.dismissed'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const typeLabel = (alert) => {
    if (alert.type === 'lambing_due') {
      return t('alerts.types.lambing_due', { term: t('breeding.birthEventTerm', { context: alert.animal_type }) })
    }
    if (alert.type === 'health_due') {
      return t('alerts.types.health_due', { kind: t(`healthRecords.kinds.${alert.kind}`) })
    }
    return t(`alerts.types.${alert.type}`)
  }

  const dueLabel = (alert) => {
    if (alert.days_until === 0) return t('alerts.dueToday')
    if (alert.days_until < 0) return t('alerts.overdueBy', { count: Math.abs(alert.days_until) })
    return t('alerts.dueIn', { count: alert.days_until })
  }

  // low_stock has no future due date — the condition is already true right
  // now — so it gets its own second line (remaining stock vs. threshold)
  // instead of the "due in N days" framing every other alert type uses.
  const detailLabel = (alert) =>
    alert.type === 'low_stock'
      ? t('alerts.lowStockDetail', { stock: alert.current_stock, unit: alert.unit, threshold: alert.low_stock_threshold })
      : `${fmtDate(alert.due_on, i18n.language)} · ${dueLabel(alert)}`

  // Every other alert type turns urgent once overdue (days_until < 0, which
  // low_stock's fixed days_until=0 never triggers) — for low_stock, urgent
  // means "completely out" instead.
  const isUrgent = (alert) => (alert.type === 'low_stock' ? alert.current_stock <= 0 : alert.days_until < 0)

  return (
    <div className={classNames(cardClass, 'p-6')}>
      <h2 className="mb-1.5 text-[22px] text-ink-900">{t('alerts.title')}</h2>
      <p className="mb-[18px] text-sm text-ink-500">{t('alerts.subtitle')}</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner message={t('alerts.loading')} /></div>
      ) : alerts.length === 0 ? (
        <EmptyState title={t('alerts.empty')} />
      ) : (
        <div className="flex flex-col gap-2.5">
          {alerts.map((alert) => {
            const AlertIcon = TYPE_ICON[alert.type] || Icon.bell
            return (
              <AlertRow
                key={alert.key}
                severity={isUrgent(alert) ? 'danger' : 'warn'}
                title={
                  <>
                    <span className="me-2 inline-flex align-middle"><AlertIcon width={16} height={16} /></span>
                    {typeLabel(alert)} — {alert.type === 'low_stock' ? alert.item_name : alert.animal_name}
                  </>
                }
                detail={detailLabel(alert)}
                actions={
                  <div className="flex flex-none items-center gap-2">
                    <button
                      onClick={() => navigate(alert.type === 'low_stock' ? '/inventory' : `/animals/${alert.animal_id}`)}
                      className={smBtnOutline}
                    >
                      {alert.type === 'low_stock' ? t('alerts.viewInventory') : t('alerts.viewAnimal')}
                    </button>
                    <button
                      onClick={() => dismissMutation.mutate(alert.key)}
                      disabled={dismissMutation.isLoading}
                      className={smBtnGhost}
                    >
                      {t('alerts.dismiss')}
                    </button>
                  </div>
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AlertsPanel
