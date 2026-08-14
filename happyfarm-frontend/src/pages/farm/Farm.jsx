import React from 'react'
import classNames from 'classnames'
import { useQuery } from 'react-query'
import { farmService } from '../../services/api/farm.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { TYPES, typeInfo, cardClass } from '../../theme/hf.jsx'

const InfoItem = ({ emoji, iconClass, label, value, sub }) => (
  <div className="flex items-center gap-3.5">
    <span className={classNames('inline-flex h-12 w-12 items-center justify-center rounded-full text-[22px]', iconClass)}>
      {emoji}
    </span>
    <div>
      <p className="text-[13px] font-medium text-tan">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-brown-text">{value}</p>
      {sub && <p className="text-[12.5px] text-tan">{sub}</p>}
    </div>
  </div>
)

const MiniStat = ({ label, value, valueClass }) => (
  <div className={classNames(cardClass, 'p-5')}>
    <p className="mb-1 text-[13px] font-medium text-tan">{label}</p>
    <div className={classNames('font-display text-[32px] font-bold', valueClass)}>{value}</div>
  </div>
)

const CareRow = ({ emoji, label, value, valueClass }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-brown">{emoji} {label}</span>
    <span className={classNames('font-display text-lg font-bold', valueClass)}>{value}</span>
  </div>
)

const Farm = () => {
  const { farm: farmCtx, user } = useAuth()
  const { data: farm, isLoading } = useQuery('farm-details', farmService.getDetails, {
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message="Loading farm…" />
      </div>
    )
  }

  const s = farm?.statistics || {}
  const total = s.total_animals || 0
  const sacrificedCount = s.sacrificed_animals || 0
  const readyCount = s.eligible_for_sacrifice || 0
  const activeCount = total - sacrificedCount
  const notEligibleCount = Math.max(0, total - sacrificedCount - readyCount)
  const fed24 = s.recently_fed || 0
  const groomed24 = s.recently_groomed || 0
  const byType = s.by_type || {}

  const farmName = farm?.name || farmCtx?.name
  const userName = farm?.owner?.name || user?.name
  const userEmail = farm?.owner?.email || user?.email
  const farmDays = farm?.created_at ? Math.max(0, Math.floor((Date.now() - new Date(farm.created_at).getTime()) / 86400000)) : 0

  return (
    <div className="animate-hf-pop">
      <h1 className="mb-[22px] text-[34px]">{farmName}</h1>

      <div className={classNames(cardClass, 'mb-6 p-6')}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
          <InfoItem emoji="🏡" iconClass="bg-green-soft" label="Farm name" value={farmName} />
          <InfoItem emoji="👤" iconClass="bg-green-badgeBg" label="Owner" value={userName} sub={userEmail} />
          <InfoItem emoji="📅" iconClass="bg-blue-soft" label="Farm age" value={`${farmDays} days`} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
        <MiniStat label="Total animals" value={total} valueClass="text-brown-text" />
        <MiniStat label="Active" value={activeCount} valueClass="text-green" />
        <MiniStat label="Ready for sacrifice" value={readyCount} valueClass="text-yellow" />
        <MiniStat label="Sacrificed" value={sacrificedCount} valueClass="text-tan" />
      </div>

      <div className="grid grid-cols-1 gap-6 wide:grid-cols-2">
        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">Animals by type</h2>
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-4">
            {TYPES.map((t) => (
              <div key={t} className={classNames('rounded-2xl px-2 py-3.5 text-center', typeInfo(t).bgClass)}>
                <div className="mx-auto mb-1 h-[46px] w-[46px]">
                  <AnimalIcon type={t} size={46} />
                </div>
                <div className="font-display text-xl font-bold text-brown-text">{byType[t] || 0}</div>
                <div className="text-xs text-tan">{typeInfo(t).label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">Care status</h2>
          <div className="flex flex-col gap-3.5">
            <CareRow emoji="🌾" label="Fed in last 24h" value={fed24} valueClass="text-green" />
            <CareRow emoji="✨" label="Groomed in last 24h" value={groomed24} valueClass="text-blue" />
            <CareRow emoji="🌙" label="Eligible for sacrifice" value={readyCount} valueClass="text-yellow" />
            <CareRow emoji="⏳" label="Not yet eligible" value={notEligibleCount} valueClass="text-tan" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Farm
