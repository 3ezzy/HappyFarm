import React from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { farmService } from '../../services/api/farm.js'
import { animalService } from '../../services/api/animals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { TYPES, speciesBgClass, ageText, badge, cardClass } from '../../theme/hf.jsx'

const StatCard = ({ value, label, className, valueClass, labelClass }) => (
  <div className={classNames('rounded-2xl p-[22px] shadow-ribbon', className)}>
    <div className={classNames('font-display text-[38px] font-bold leading-none', valueClass)}>{value}</div>
    <p className={classNames('mt-2 text-sm font-medium', labelClass)}>{label}</p>
  </div>
)

const quickActionBase =
  'flex cursor-pointer items-center justify-between gap-2 rounded-full px-5 py-[13px] ' +
  'font-display text-[15px] font-bold shadow-soft transition-all duration-200 ease-pop hover:scale-[1.03]'

const QuickAction = ({ label, onClick, className }) => (
  <button onClick={onClick} className={classNames(quickActionBase, className)}>
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
    <div className="animate-hf-pop">
      {/* Welcome banner */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-[18px] rounded-2xl bg-brown px-7 py-[26px] shadow-toast">
        <div>
          <h1 className="mb-2 text-[32px] leading-[1.1] text-cream">{t('dashboard.welcome', { name: firstName })}</h1>
          <p className="text-base text-cream-muted">{t('dashboard.todayAt', { farm: farm?.name })}</p>
        </div>
        <div className="rounded-full bg-green-dark px-4 py-2">
          <span className="text-[13.5px] font-medium text-cream">{today}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
        <StatCard value={total} label={t('dashboard.totalAnimals')} className="bg-cream" valueClass="text-brown-text" labelClass="text-tan" />
        <StatCard value={readyCount} label={t('dashboard.readyForSacrifice')} className="bg-green" valueClass="text-white" labelClass="text-green-pale" />
        <StatCard value={notEligibleCount} label={t('dashboard.notYetEligible')} className="bg-yellow" valueClass="text-brown-text" labelClass="text-yellow-text" />
        <StatCard value={sacrificedCount} label={t('dashboard.alreadySacrificed')} className="bg-tan" valueClass="text-white" labelClass="text-cream-muted" />
      </div>

      {/* Flock + quick actions */}
      <div className="grid grid-cols-1 items-start gap-6 wide:grid-cols-[1.4fr_1fr]">
        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">{t('dashboard.yourFlock')}</h2>
          <div className="grid grid-cols-2 gap-3.5 xs:grid-cols-4">
            {byType.map((bt) => (
              <div key={bt.type} className={classNames('rounded-2xl px-2.5 py-3.5 text-center', bt.bgClass)}>
                <div className="mx-auto mb-1.5 h-[54px] w-[54px]">
                  <AnimalIcon type={bt.type} size={54} />
                </div>
                <div className="font-display text-[22px] font-bold text-brown-text">{bt.count}</div>
                <div className="text-[12.5px] font-medium text-tan">{bt.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-green-soft p-6 shadow-ribbon">
          <h2 className="mb-4 text-[22px]">{t('dashboard.quickActions')}</h2>
          <div className="flex flex-col gap-3">
            <QuickAction label={t('dashboard.addNewAnimal')} onClick={() => navigate('/animals/add')} className="border-none bg-brown text-white hover:bg-brown-dark" />
            <QuickAction label={t('dashboard.viewAllAnimals')} onClick={() => navigate('/animals')} className="border-none bg-green text-white hover:bg-green-dark" />
            <QuickAction label={t('dashboard.farmStatistics')} onClick={() => navigate('/farm')} className="border-2 border-line bg-cream text-brown-text" />
          </div>
        </div>
      </div>

      {/* Recent animals */}
      <div className={classNames(cardClass, 'mt-6 p-6')}>
        <h2 className="mb-1.5 text-[22px]">{t('dashboard.recentAnimals')}</h2>
        <p className="mb-[18px] text-sm text-tan">{t('dashboard.recentAnimalsSub')}</p>
        {recent.length === 0 ? (
          <p className="text-tan">{t('dashboard.noAnimalsYet')}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/animals/${a.id}`)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border-none bg-green-soft2 px-4 py-3 text-start transition-all duration-200 ease-pop hover:scale-[1.01] hover:bg-green-hover"
              >
                <span className="flex items-center gap-3.5">
                  <span className={classNames('inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl', speciesBgClass(a.type))}>
                    <AnimalIcon type={a.type} size={40} />
                  </span>
                  <span>
                    <span className="block font-display text-[17px] font-bold text-brown-text">{a.name}</span>
                    <span className="block text-[13.5px] text-tan">{t(`species.${a.type}.label`)} · {ageText(a.age, t)}</span>
                  </span>
                </span>
                {a.is_sacrificed ? (
                  <span className={badge('sacrificed')}>{t('animals.filters.sacrificed')}</span>
                ) : (
                  <span className={badge('active')}>{t('animals.filters.active')}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
