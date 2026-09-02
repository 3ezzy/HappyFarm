import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useQuery } from 'react-query'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { farmService } from '../../services/api/farm.js'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { cardClass, C, StatCard } from '../../theme/hf.jsx'

// Fixed per-status color (not positional "use in order") — these status
// words appear in two side-by-side pie charts (current status vs. cycle
// outcome) and must read as the same color in both. Positional assignment
// via Object.entries() order could give e.g. "bred" a different color in
// each chart, since the two API objects are independent. Substitution
// preserves the exact word→hue-family associations the legacy palette
// already had (bred=yellow, pregnant=blue, not_bred/not_pregnant=tan,
// available/lambed=green), remapped 1:1 onto the Meadow chart tokens.
const BREEDING_STATUS_COLORS = { not_bred: C.chart6, bred: C.chart3, pregnant: C.chart2, nursing: C.chart5, available: C.chart1 }
const BREEDING_OUTCOME_COLORS = { bred: C.chart3, pregnant: C.chart2, not_pregnant: C.chart6, aborted: C.chart4, lambed: C.chart1 }
const ALERT_TYPE_COLORS = {
  breeding_check_due: C.chart2,
  lambing_due: C.chart1,
  weaning_due: C.chart3,
  reinsemination_due: C.chart5,
  health_due: C.chart4,
}

const Reports = () => {
  const { t, i18n } = useTranslation()
  const { data: stats, isLoading } = useQuery('farm-statistics', farmService.getStatistics, {
    refetchOnWindowFocus: true,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message={t('common.loading')} />
      </div>
    )
  }

  const monthLabel = (ym) => {
    const [year, month] = ym.split('-').map(Number)
    return new Intl.DateTimeFormat(i18n.language, { month: 'short' }).format(new Date(year, month - 1, 1))
  }

  const expense = stats?.expense_summary || { total: 0, by_kind: {}, by_month: [] }
  const byMonthData = expense.by_month.map((m) => ({ ...m, label: monthLabel(m.month) }))
  const byKindData = Object.entries(expense.by_kind).map(([kind, total]) => ({
    kind,
    label: t(`healthRecords.kinds.${kind}`),
    total,
  }))

  const breeding = stats?.breeding_performance || { by_status: {}, total_births: 0, total_offspring_alive: 0, total_offspring_total: 0, weaning_rate: null }
  const breedingOutcomeData = Object.entries(breeding.by_status)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status, label: t(`reports.breedingOutcomes.${status}`), value: count }))

  const statusCounts = stats?.breeding_status_counts || {}
  const statusData = Object.entries(statusCounts)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => ({ status, label: t(`breeding.status.${status}`), value: count }))

  const alerts = stats?.alert_summary || { total: 0, by_type: {} }
  const alertData = Object.entries(alerts.by_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      type,
      label: t(`reports.alertTypes.${type}`),
      count,
    }))

  return (
    <div>
      <h1 className="mb-1 text-[34px]">{t('reports.title')}</h1>
      <p className="mb-[22px] text-ink-500">{t('reports.subtitle')}</p>

      {/* Expense summary */}
      <div className={classNames(cardClass, 'mb-6 p-6')}>
        <h2 className="mb-[18px] text-[22px]">{t('reports.expenses.title')}</h2>
        <div className="mb-5 grid grid-cols-1 gap-3.5 xs:grid-cols-2">
          <StatCard value={expense.total.toFixed(2)} label={t('reports.expenses.total')} />
        </div>
        <p className="mb-2 text-sm font-semibold text-ink-900">{t('reports.expenses.byMonth')}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byMonthData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" name={t('reports.expenses.total')} fill={C.chart1} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {byKindData.length > 0 && (
          <>
            <p className="mb-2 mt-6 text-sm font-semibold text-ink-900">{t('reports.expenses.byKind')}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byKindData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" name={t('reports.expenses.total')} fill={C.chart2} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Breeding performance */}
      <div className={classNames(cardClass, 'mb-6 p-6')}>
        <h2 className="mb-[18px] text-[22px]">{t('reports.breeding.title')}</h2>
        <div className="mb-5 grid grid-cols-1 gap-3.5 xs:grid-cols-3">
          <StatCard value={breeding.total_births} label={t('reports.breeding.totalBirths')} />
          <StatCard value={<span className="text-ok-fg">{breeding.total_offspring_alive}</span>} label={t('reports.breeding.totalOffspring')} />
          <StatCard
            value={<span className="text-info-fg">{breeding.weaning_rate === null ? '—' : `${breeding.weaning_rate}%`}</span>}
            label={t('reports.breeding.weaningRate')}
          />
        </div>
        {breedingOutcomeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={breedingOutcomeData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={85} label>
                {breedingOutcomeData.map((entry) => (
                  <Cell key={entry.status} fill={BREEDING_OUTCOME_COLORS[entry.status] || C.chart6} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-ink-500">{t('reports.breeding.empty')}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 wide:grid-cols-2">
        {/* Current breeding status headcount */}
        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">{t('reports.status.title')}</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={85} label>
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={BREEDING_STATUS_COLORS[entry.status] || C.chart6} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-500">{t('reports.status.empty')}</p>
          )}
        </div>

        {/* Alerts summary */}
        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">{t('reports.alerts.title')}</h2>
          {alerts.total > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={alertData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name={t('reports.alerts.title')}>
                  {alertData.map((entry) => (
                    <Cell key={entry.type} fill={ALERT_TYPE_COLORS[entry.type] || C.chart6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-ink-500">{t('reports.alerts.empty')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
