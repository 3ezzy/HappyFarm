import React from 'react'
import { useQuery } from 'react-query'
import { farmService } from '../../services/api/farm.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { C, TYPES, typeInfo } from '../../theme/hf.jsx'

const card = { background: C.cream, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }

const InfoItem = ({ emoji, bg, label, value, sub }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
    <span style={{ display: 'inline-flex', width: '48px', height: '48px', background: bg, borderRadius: '9999px', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{emoji}</span>
    <div>
      <p style={{ margin: 0, fontSize: '13px', color: C.tan, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '18px', color: C.brownText }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: '12.5px', color: C.tan }}>{sub}</p>}
    </div>
  </div>
)

const MiniStat = ({ label, value, valueColor }) => (
  <div style={{ ...card, padding: '20px' }}>
    <p style={{ margin: '0 0 4px', fontSize: '13px', color: C.tan, fontWeight: 500 }}>{label}</p>
    <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '32px', color: valueColor }}>{value}</div>
  </div>
)

const CareRow = ({ emoji, label, value, color }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <span style={{ fontSize: '14px', color: C.brown, fontWeight: 500 }}>{emoji} {label}</span>
    <span style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '18px', color }}>{value}</span>
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
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
    <div className="hf-anim-pop">
      <h1 style={{ fontSize: '34px', marginBottom: '22px' }}>{farmName}</h1>

      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '20px' }}>
          <InfoItem emoji="🏡" bg={C.greenSoft} label="Farm name" value={farmName} />
          <InfoItem emoji="👤" bg="#E4F5E9" label="Owner" value={userName} sub={userEmail} />
          <InfoItem emoji="📅" bg="#EAF2FB" label="Farm age" value={`${farmDays} days`} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '20px', marginBottom: '24px' }}>
        <MiniStat label="Total animals" value={total} valueColor={C.brownText} />
        <MiniStat label="Active" value={activeCount} valueColor={C.green} />
        <MiniStat label="Ready for sacrifice" value={readyCount} valueColor={C.yellow} />
        <MiniStat label="Sacrificed" value={sacrificedCount} valueColor={C.tan} />
      </div>

      <div className="hf-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={card}>
          <h2 style={{ fontSize: '22px', marginBottom: '18px' }}>Animals by type</h2>
          <div className="hf-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}>
            {TYPES.map((t) => (
              <div key={t} style={{ background: typeInfo(t).bg, borderRadius: '16px', padding: '14px 8px', textAlign: 'center' }}>
                <div style={{ width: '46px', height: '46px', margin: '0 auto 4px' }}>
                  <AnimalIcon type={t} size={46} />
                </div>
                <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '20px', color: C.brownText }}>{byType[t] || 0}</div>
                <div style={{ fontSize: '12px', color: C.tan }}>{typeInfo(t).label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: '22px', marginBottom: '18px' }}>Care status</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <CareRow emoji="🌾" label="Fed in last 24h" value={fed24} color={C.green} />
            <CareRow emoji="✨" label="Groomed in last 24h" value={groomed24} color={C.blue} />
            <CareRow emoji="🌙" label="Eligible for sacrifice" value={readyCount} color={C.yellow} />
            <CareRow emoji="⏳" label="Not yet eligible" value={notEligibleCount} color={C.tan} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Farm
