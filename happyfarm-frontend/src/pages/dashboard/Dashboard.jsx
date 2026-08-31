import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { farmService } from '../../services/api/farm.js'
import { animalService } from '../../services/api/animals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import AlertsPanel from '../../components/alerts/AlertsPanel.jsx'
import {
  TYPES, speciesBgClass, ageText, cardClass,
  StatCard, EarTag, Pill, EmptyState,
  btnPrimary, btnSecondary, btnGhost,
} from '../../theme/hf.jsx'

const QuickAction = ({ label, onClick, variant }) => (
  <button onClick={onClick} className={classNames(variant, 'w-full justify-between')}>
    {label} <span className="text-lg rtl:rotate-180">→</span>
  </button>
)

const Dashboard = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, farm } = useAuth()

  const { data: stats = {}, isLoading: statsLoading } = useQuery('farm-statistics', farmService.getStatistics, {
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })
  const { data: animals = [], isLoading: animalsLoading } = useQuery('animals', animalService.getAll, {
    refetchOnWindowFocus: true,
  })

  if (statsLoading || animalsLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message={t('common.loading')} />
      </div>
    )
  }

  const total = stats.total_animals ?? animals.length
  const readyCount = stats.sacrifice_status?.eligible_for_sacrifice ?? animals.filter((a) => a.is_eligible).length
  const notEligibleCount =
    stats.sacrifice_status?.not_yet_eligible ?? animals.filter((a) => !a.is_sacrificed && !a.is_eligible).length
  const sacrificedCount = stats.sacrifice_status?.already_sacrificed ?? animals.filter((a) => a.is_sacrificed).length

  // breeding_status is backend-derived per animal (see Animal::breeding_status)
  // — there's no dedicated statistics field for it yet, so this aggregates
  // the same way the type/eligibility fallbacks above already do.
  const pregnantCount = animals.filter((a) => !a.is_sacrificed && a.breeding_status === 'pregnant').length
  const nursingCount = animals.filter((a) => !a.is_sacrificed && a.breeding_status === 'nursing').length

  const byType = TYPES.map((type) => ({
    type,
    label: t(`species.${type}.label`),
    bgClass: speciesBgClass(type),
    count: stats.animals_by_type?.[type] ?? animals.filter((a) => a.type === type).length,
  }))

  const recent = animals.slice().reverse().slice(0, 4)
  const firstName = (user?.name || '').split(' ')[0]
  const today = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date())

  return (
    <div>
      {/* Welcome banner */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-[18px] rounded-lg bg-meadow-900 px-7 py-[26px] shadow-e2">
        <div>
          <h1 className="mb-2 text-[32px] leading-[1.1] text-white">{t('dashboard.welcome', { name: firstName })}</h1>
          <p className="text-base text-meadow-100">{t('dashboard.todayAt', { farm: farm?.name })}</p>
        </div>
        <div className="rounded-pill bg-meadow-700 px-4 py-2">
          <span className="text-[13.5px] font-medium text-white">{today}</span>
        </div>
      </div>

      {/* Alerts — computed on open, no scheduler behind this */}
      <div className="mb-6">
        <AlertsPanel />
      </div>

      {/* Stat cards — neutral surfaces; meaning lives in the value text,
          not the card background. The yellow accent border is reserved
          for a future Eid-countdown card. */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <StatCard value={total} label={t('dashboard.totalAnimals')} />
        <StatCard value={<span className="text-ok-fg">{readyCount}</span>} label={t('dashboard.readyForSacrifice')} />
        <StatCard value={<span className="text-warn-fg">{notEligibleCount}</span>} label={t('dashboard.notYetEligible')} />
        <StatCard value={<span className="text-hold-fg">{sacrificedCount}</span>} label={t('dashboard.alreadySacrificed')} />
        <StatCard value={<span className="text-info-fg">{pregnantCount}</span>} label={t('dashboard.pregnant')} />
        <StatCard value={<span className="text-info-fg">{nursingCount}</span>} label={t('dashboard.nursing')} />
      </div>

      {/* Flock + quick actions */}
      <div className="grid grid-cols-1 items-start gap-6 wide:grid-cols-[1.4fr_1fr]">
        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px] text-ink-900">{t('dashboard.yourFlock')}</h2>
          <div className="grid grid-cols-2 gap-3.5 xs:grid-cols-4">
            {byType.map((bt) => (
              <div key={bt.type} className={classNames('rounded-lg px-2.5 py-3.5 text-center', bt.bgClass)}>
                <div className="mx-auto mb-1.5 h-[54px] w-[54px]">
                  <AnimalIcon type={bt.type} size={54} />
                </div>
                <div className="font-display text-[22px] font-semibold text-ink-900">{bt.count}</div>
                <div className="text-[12.5px] font-medium text-ink-500">{bt.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-surface-card p-6 shadow-e1">
          <h2 className="mb-4 text-[22px] text-ink-900">{t('dashboard.quickActions')}</h2>
          <div className="flex flex-col gap-3">
            <QuickAction label={t('dashboard.addNewAnimal')} onClick={() => navigate('/animals/add')} variant={btnPrimary} />
            <QuickAction label={t('dashboard.viewAllAnimals')} onClick={() => navigate('/animals')} variant={btnSecondary} />
            <QuickAction label={t('dashboard.farmStatistics')} onClick={() => navigate('/farm')} variant={btnGhost} />
            <QuickAction label={t('dashboard.viewReports')} onClick={() => navigate('/reports')} variant={btnGhost} />
          </div>
        </div>
      </div>

      {/* Recent animals */}
      <div className={classNames(cardClass, 'mt-6 p-6')}>
        <h2 className="mb-1.5 text-[22px] text-ink-900">{t('dashboard.recentAnimals')}</h2>
        <p className="mb-[18px] text-sm text-ink-500">{t('dashboard.recentAnimalsSub')}</p>
        {recent.length === 0 ? (
          <EmptyState title={t('dashboard.noAnimalsYet')} />
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/animals/${a.id}`)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded border border-line bg-surface-card px-4 py-3 text-start transition-colors duration-hf hover:bg-surface-sunken"
              >
                <span className="flex items-center gap-3.5">
                  <span className={classNames('inline-flex h-[46px] w-[46px] items-center justify-center rounded-lg', speciesBgClass(a.type))}>
                    <AnimalIcon type={a.type} size={40} />
                  </span>
                  <span>
                    <span className="mb-1 flex items-center gap-2">
                      <span className="font-display text-[17px] font-semibold text-ink-900">{a.name}</span>
                      <EarTag species={a.type} tag={a.tag} archived={a.is_sacrificed} />
                    </span>
                    <span className="block text-[13.5px] text-ink-500">{t(`species.${a.type}.label`)} · {ageText(a.age, t)}</span>
                  </span>
                </span>
                <Pill tone={a.is_sacrificed ? 'hold' : 'ok'}>
                  {t(a.is_sacrificed ? 'animals.filters.sacrificed' : 'animals.filters.active')}
                </Pill>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
