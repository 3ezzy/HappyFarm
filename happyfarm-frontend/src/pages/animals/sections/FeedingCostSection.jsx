import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { feedingCostService } from '../../../services/api/feedingCosts.js'
import LoadingSpinner from '../../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, fmtDate, fmtCurrency, cardClass, badge, btnPrimary, btnSecondary, StatCard } from '../../../theme/hf.jsx'
import { apiErrorMessage } from '../../../utils/apiError.js'

const today = () => new Date().toISOString().slice(0, 10)
const fieldLabel = 'mb-1.5 block text-xs font-medium text-ink-700'

/**
 * Displays and extends the animal's feeding-cost period history. The
 * backend (FeedingCostManager) is the only place periods are opened or
 * closed — this section only lists what the API already returns and
 * submits new-rate requests through POST .../feeding-costs. current_daily_cost
 * and total_feeding_cost are read straight off the animal payload, never
 * recomputed here.
 */
const FeedingCostSection = ({ animalId, animal }) => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [dailyCost, setDailyCost] = useState('')
  const [effectiveFrom, setEffectiveFrom] = useState('')

  const { data: periods = [], isLoading } = useQuery(
    ['feeding-costs', animalId],
    () => feedingCostService.getAll(animalId)
  )

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries(['feeding-costs', animalId]),
      queryClient.invalidateQueries(['animal', animalId]),
    ])

  const createMutation = useMutation((payload) => feedingCostService.create(animalId, payload), {
    onSuccess: async () => {
      await invalidate()
      setShowForm(false)
      setDailyCost('')
      setEffectiveFrom('')
      toast.success(t('feedingCost.created'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const isFirstPeriod = periods.length === 0
  const isInactive = animal.is_archived || animal.is_sacrificed || !!animal.exit_reason

  const openForm = () => {
    setDailyCost('')
    setEffectiveFrom(animal.date_of_purchase || animal.date_of_birth || today())
    setShowForm(true)
  }

  const submit = () => {
    const value = parseFloat(dailyCost)
    if (dailyCost === '' || Number.isNaN(value) || value < 0) {
      toast.error(t('feedingCost.dailyCostRequired'))
      return
    }
    const payload = { daily_cost: value }
    if (isFirstPeriod && effectiveFrom) {
      payload.effective_from = effectiveFrom
    }
    createMutation.mutate(payload)
  }

  return (
    <div className={classNames(cardClass, 'p-7')}>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px]">{t('feedingCost.title')}</h2>
        {!isInactive && !showForm && (
          <button onClick={openForm} className={btnPrimary}>
            {animal.current_daily_cost == null ? t('feedingCost.setCost') : t('feedingCost.changeCost')}
          </button>
        )}
      </div>

      {isInactive && <p className="mb-[18px] text-[12.5px] text-ink-500">{t('feedingCost.unavailableNote')}</p>}

      <div className="mb-5 grid grid-cols-2 gap-3">
        <StatCard
          value={animal.current_daily_cost != null ? fmtCurrency(animal.current_daily_cost, i18n.language) : '—'}
          label={t('feedingCost.currentDailyCost')}
        />
        <StatCard
          value={animal.total_feeding_cost != null ? fmtCurrency(animal.total_feeding_cost, i18n.language) : '—'}
          label={t('feedingCost.totalFeedingCost')}
        />
      </div>

      {showForm && (
        <div className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface-sunken p-4 xs:grid-cols-3">
          <div>
            <label className={fieldLabel}>{t('feedingCost.dailyCostLabel')}</label>
            <HfInput type="number" min="0" step="0.01" value={dailyCost} onChange={(e) => setDailyCost(e.target.value)} />
          </div>
          {isFirstPeriod && (
            <div>
              <label className={fieldLabel}>{t('feedingCost.effectiveFromLabel')}</label>
              <HfInput type="date" value={effectiveFrom} max={today()} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </div>
          )}
          <div className="flex gap-2 xs:col-span-3">
            <button onClick={submit} disabled={createMutation.isLoading} className={btnPrimary}>
              {createMutation.isLoading ? t('feedingCost.submitting') : t('feedingCost.submit')}
            </button>
            <button onClick={() => setShowForm(false)} className={btnSecondary}>{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><LoadingSpinner message={t('common.loading')} /></div>
      ) : periods.length === 0 ? (
        <p className="text-sm text-ink-500">{t('feedingCost.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {periods.map((p) => (
            <div key={p.id} className="rounded-lg border border-line bg-surface-sunken px-4 py-3.5">
              <div className="flex flex-wrap items-center gap-2">
                {p.effective_until === null && <span className={badge('active')}>{t('feedingCost.current')}</span>}
                <span className="font-display text-[15px] font-semibold text-ink-900">
                  {fmtDate(p.effective_from, i18n.language)} – {p.effective_until ? fmtDate(p.effective_until, i18n.language) : t('feedingCost.ongoing')}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12.5px] text-ink-500">
                <span>
                  {`${fmtCurrency(p.daily_cost, i18n.language)}${t('feedingCost.perDay')} × ${t('feedingCost.daysUnit', { count: p.days })} = ${fmtCurrency(p.subtotal, i18n.language)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FeedingCostSection
