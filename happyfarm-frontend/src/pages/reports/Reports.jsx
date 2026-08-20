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
import { cardClass, C } from '../../theme/hf.jsx'

const BREEDING_STATUS_COLORS = { not_bred: C.tan, bred: C.yellow, pregnant: C.blue, nursing: C.brown, available: C.green }
const BREEDING_OUTCOME_COLORS = { bred: C.yellow, pregnant: C.blue, not_pregnant: C.tan, aborted: C.red, lambed: C.green }
const ALERT_TYPE_COLORS = {
  breeding_check_due: C.blue,
  lambing_due: C.green,
  weaning_due: C.yellow,
  reinsemination_due: C.brown,
  health_due: C.red,
}
const MiniStat = ({ label, value, valueClass }) => (
  <div className={classNames(cardClass, 'p-5')}>
    <p className="mb-1 text-[13px] font-medium text-tan">{label}</p>
    <div className={classNames('font-display text-[28px] font-bold', valueClass)}>{value}</div>
  </div>
)

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
    <div className="animate-hf-pop">
      <h1 className="mb-1 text-[34px]">{t('reports.title')}</h1>
      <p className="mb-[22px] text-tan">{t('reports.subtitle')}</p>

      {/* Expense summary */}
      <div className={classNames(cardClass, 'mb-6 p-6')}>
        <h2 className="mb-[18px] text-[22px]">{t('reports.expenses.title')}</h2>
        <div className="mb-5 grid grid-cols-1 gap-3.5 xs:grid-cols-2">
          <MiniStat label={t('reports.expenses.total')} value={expense.total.toFixed(2)} valueClass="text-brown-text" />
        </div>
        <p className="mb-2 text-sm font-semibold text-brown-text">{t('reports.expenses.byMonth')}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byMonthData}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" name={t('reports.expenses.total')} fill={C.green} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {byKindData.length > 0 && (
          <>
            <p className="mb-2 mt-6 text-sm font-semibold text-brown-text">{t('reports.expenses.byKind')}</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byKindData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" name={t('reports.expenses.total')} fill={C.blue} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Breeding performance */}
      <div className={classNames(cardClass, 'mb-6 p-6')}>
        <h2 className="mb-[18px] text-[22px]">{t('reports.breeding.title')}</h2>
        <div className="mb-5 grid grid-cols-1 gap-3.5 xs:grid-cols-3">
          <MiniStat label={t('reports.breeding.totalBirths')} value={breeding.total_births} valueClass="text-brown-text" />
          <MiniStat label={t('reports.breeding.totalOffspring')} value={breeding.total_offspring_alive} valueClass="text-green" />
          <MiniStat
            label={t('reports.breeding.weaningRate')}
            value={breeding.weaning_rate === null ? '—' : `${breeding.weaning_rate}%`}
            valueClass="text-blue"
          />
        </div>
        {breedingOutcomeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={breedingOutcomeData} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={85} label>
                {breedingOutcomeData.map((entry) => (
                  <Cell key={entry.status} fill={BREEDING_OUTCOME_COLORS[entry.status] || C.tan} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-tan">{t('reports.breeding.empty')}</p>
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
                    <Cell key={entry.status} fill={BREEDING_STATUS_COLORS[entry.status] || C.tan} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-tan">{t('reports.status.empty')}</p>
          )}
        </div>

        {/* Alerts summary */}
        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">{t('reports.alerts.title')}</h2>
          {alerts.total > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={alertData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name={t('reports.alerts.title')}>
                  {alertData.map((entry) => (
                    <Cell key={entry.type} fill={ALERT_TYPE_COLORS[entry.type] || C.tan} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-tan">{t('reports.alerts.empty')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
