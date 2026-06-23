import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { farmService } from '../../services/api/farm.js'
import { animalService } from '../../services/api/animals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { C, Hoverable, TYPES, typeInfo, ageText, eligible } from '../../theme/hf.jsx'

const card = { background: C.cream, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }

const StatCard = ({ value, label, bg, valueColor, labelColor }) => (
  <div style={{ background: bg, borderRadius: '16px', padding: '22px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }}>
    <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '38px', color: valueColor, lineHeight: 1 }}>{value}</div>
    <p style={{ margin: '8px 0 0', fontSize: '14px', color: labelColor, fontWeight: 500 }}>{label}</p>
  </div>
)

const QuickAction = ({ label, onClick, bg, color, border, hoverBg }) => (
  <Hoverable
    onClick={onClick}
    baseStyle={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      background: bg,
      color,
      fontFamily: "'Zilla Slab', serif",
      fontWeight: 700,
      fontSize: '15px',
      padding: '13px 20px',
      border: border || 'none',
      borderRadius: '9999px',
      boxShadow: '0 2px 4px rgba(107,92,67,0.16)',
      cursor: 'pointer',
      transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .2s',
    }}
    hoverStyle={{ transform: 'scale(1.03)', background: hoverBg || bg }}
  >
    {label} <span style={{ fontSize: '18px' }}>→</span>
  </Hoverable>
)

const Dashboard = () => {
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <LoadingSpinner size="large" message="Loading dashboard…" />
      </div>
    )
  }

  const total = stats.total_animals ?? animals.length
  const readyCount = stats.sacrifice_status?.eligible_for_sacrifice ?? animals.filter(eligible).length
  const notEligibleCount =
    stats.sacrifice_status?.not_yet_eligible ?? animals.filter((a) => !a.is_sacrificed && !eligible(a)).length
  const sacrificedCount = stats.sacrifice_status?.already_sacrificed ?? animals.filter((a) => a.is_sacrificed).length

  const byType = TYPES.map((t) => ({
    type: t,
    label: typeInfo(t).label,
    bg: typeInfo(t).bg,
    count: stats.animals_by_type?.[t] ?? animals.filter((a) => a.type === t).length,
  }))

  const recent = animals.slice().reverse().slice(0, 4)
  const firstName = (user?.name || '').split(' ')[0]
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="hf-anim-pop">
      {/* Welcome banner */}
      <div
        style={{
          background: C.brown,
          borderRadius: '16px',
          padding: '26px 28px',
          boxShadow: '0 10px 20px -3px rgba(107,92,67,0.22)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '18px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ color: C.cream, fontSize: '32px', lineHeight: 1.1, marginBottom: '8px' }}>Welcome back, {firstName}! 🌿</h1>
          <p style={{ color: '#ECE7D2', fontSize: '16px', margin: 0 }}>Here's what's happening at {farm?.name} today.</p>
        </div>
        <div style={{ background: C.greenDark, borderRadius: '9999px', padding: '8px 16px' }}>
          <span style={{ color: C.cream, fontSize: '13.5px', fontWeight: 500 }}>{today}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '20px', marginBottom: '24px' }}>
        <StatCard value={total} label="Total animals" bg={C.cream} valueColor={C.brownText} labelColor={C.tan} />
        <StatCard value={readyCount} label="Ready for sacrifice" bg={C.green} valueColor="#fff" labelColor="#BEE6D5" />
        <StatCard value={notEligibleCount} label="Not yet eligible" bg={C.yellow} valueColor={C.brownText} labelColor="#7A5A18" />
        <StatCard value={sacrificedCount} label="Already sacrificed" bg={C.tan} valueColor="#fff" labelColor="#ECE7D2" />
      </div>

      {/* Flock + quick actions */}
      <div className="hf-dash-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
        <div style={card}>
          <h2 style={{ fontSize: '22px', marginBottom: '18px' }}>Your flock</h2>
          <div className="hf-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
            {byType.map((bt) => (
              <div key={bt.type} style={{ background: bt.bg, borderRadius: '16px', padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ width: '54px', height: '54px', margin: '0 auto 6px' }}>
                  <AnimalIcon type={bt.type} size={54} />
                </div>
                <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '22px', color: C.brownText }}>{bt.count}</div>
                <div style={{ fontSize: '12.5px', color: C.tan, fontWeight: 500 }}>{bt.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.greenSoft, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Quick actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <QuickAction label="Add a new animal" onClick={() => navigate('/animals/add')} bg={C.brown} color="#fff" hoverBg={C.brownDark} />
            <QuickAction label="View all animals" onClick={() => navigate('/animals')} bg={C.green} color="#fff" hoverBg={C.greenDark} />
            <QuickAction label="Farm statistics" onClick={() => navigate('/farm')} bg={C.cream} color={C.brownText} border="2px solid #C9BD9F" />
          </div>
        </div>
      </div>

      {/* Recent animals */}
      <div style={{ ...card, marginTop: '24px' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '6px' }}>Recent animals</h2>
        <p style={{ margin: '0 0 18px', fontSize: '14px', color: C.tan }}>Your latest additions to the farm.</p>
        {recent.length === 0 ? (
          <p style={{ color: C.tan, margin: 0 }}>No animals yet — add your first one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recent.map((a) => {
              const ti = typeInfo(a.type)
              return (
                <Hoverable
                  key={a.id}
                  onClick={() => navigate(`/animals/${a.id}`)}
                  baseStyle={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    width: '100%',
                    textAlign: 'left',
                    background: C.greenSoft2,
                    border: 'none',
                    borderRadius: '16px',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    transition: 'transform .18s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .18s',
                  }}
                  hoverStyle={{ transform: 'scale(1.01)', background: '#DCEFE8' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ display: 'inline-flex', width: '46px', height: '46px', background: ti.bg, borderRadius: '12px', alignItems: 'center', justifyContent: 'center' }}>
                      <AnimalIcon type={a.type} size={40} />
                    </span>
                    <span>
                      <span style={{ display: 'block', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '17px', color: C.brownText }}>{a.name}</span>
                      <span style={{ display: 'block', fontSize: '13.5px', color: C.tan }}>{ti.label} · {ageText(a.age)}</span>
                    </span>
                  </span>
                  {a.is_sacrificed ? (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: C.tan, background: '#ECE7D2', border: '2px solid #C9BD9F', borderRadius: '9999px', padding: '3px 12px' }}>Sacrificed</span>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#2E7A48', background: '#E4F5E9', border: '2px solid #C7E9D2', borderRadius: '9999px', padding: '3px 12px' }}>Active</span>
                  )}
                </Hoverable>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
