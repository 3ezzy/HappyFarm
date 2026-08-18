import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { alertService } from '../../services/api/alerts.js'
import LoadingSpinner from '../common/UI/LoadingSpinner.jsx'
import { fmtDate, cardClass } from '../../theme/hf.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const TYPE_ICON = {
  breeding_check_due: '🩺',
  lambing_due: '🐣',
  weaning_due: '🌾',
  reinsemination_due: '💞',
  health_due: '💉',
}

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

  return (
    <div className={classNames(cardClass, 'p-6')}>
      <h2 className="mb-1.5 text-[22px]">{t('alerts.title')}</h2>
      <p className="mb-[18px] text-sm text-tan">{t('alerts.subtitle')}</p>

      {isLoading ? (
        <div className="flex justify-center py-8"><LoadingSpinner message={t('alerts.loading')} /></div>
      ) : alerts.length === 0 ? (
        <p className="text-sm text-tan">{t('alerts.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.key}
              className={classNames(
                'flex flex-wrap items-center justify-between gap-3 rounded-xl px-4 py-3',
                alert.days_until < 0 ? 'bg-red-soft' : 'bg-yellow-badgeBg'
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl">{TYPE_ICON[alert.type] || '🔔'}</span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-bold text-brown-text">
                    {typeLabel(alert)} — {alert.animal_name}
                  </p>
                  <p className="text-[12.5px] text-tan">
                    {fmtDate(alert.due_on, i18n.language)} · {dueLabel(alert)}
                  </p>
                </div>
              </div>
              <div className="flex flex-none items-center gap-2">
                <button
                  onClick={() => navigate(`/animals/${alert.animal_id}`)}
                  className="cursor-pointer rounded-full border-2 border-line bg-cream px-3.5 py-1.5 font-display text-[12.5px] font-bold text-brown-text transition-transform duration-150 hover:scale-105"
                >
                  {t('alerts.viewAnimal')}
                </button>
                <button
                  onClick={() => dismissMutation.mutate(alert.key)}
                  disabled={dismissMutation.isLoading}
                  className="cursor-pointer rounded-full border-none bg-brown px-3.5 py-1.5 font-display text-[12.5px] font-bold text-white shadow-chip transition-transform duration-150 enabled:hover:scale-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {t('alerts.dismiss')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AlertsPanel
