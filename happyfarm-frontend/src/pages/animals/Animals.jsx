import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { C, Hoverable, TYPES, typeInfo, ageText, eligible } from '../../theme/hf.jsx'

const addBtnBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  background: C.brown,
  color: '#fff',
  fontFamily: "'Zilla Slab', serif",
  fontWeight: 700,
  fontSize: '15px',
  padding: '12px 24px',
  border: 'none',
  borderRadius: '9999px',
  boxShadow: '0 2px 4px rgba(107,92,67,0.16)',
  cursor: 'pointer',
  transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .2s',
}

const filterStyle = (active) => ({
  border: `2px solid ${active ? C.green : C.border}`,
  cursor: 'pointer',
  fontFamily: "'Libre Franklin', sans-serif",
  fontWeight: 600,
  fontSize: '13.5px',
  padding: '7px 16px',
  borderRadius: '9999px',
  transition: 'all .18s',
  background: active ? C.green : C.cream,
  color: active ? '#fff' : C.brown,
})

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'sacrificed', label: 'Sacrificed' },
  { key: 'sheep', label: 'Sheep' },
  { key: 'goat', label: 'Goats' },
  { key: 'cow', label: 'Cows' },
  { key: 'camel', label: 'Camels' },
]

const Animals = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  const { data: animals = [], isLoading } = useQuery('animals', animalService.getAll, {
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  let list = animals.slice()
  if (filter === 'active') list = list.filter((a) => !a.is_sacrificed)
  else if (filter === 'sacrificed') list = list.filter((a) => a.is_sacrificed)
  else if (TYPES.includes(filter)) list = list.filter((a) => a.type === filter)

  return (
    <div className="hf-anim-pop">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <h1 style={{ fontSize: '34px' }}>Your animals</h1>
        <Hoverable onClick={() => navigate('/animals/add')} baseStyle={addBtnBase} hoverStyle={{ transform: 'scale(1.04)', background: C.brownDark }}>
          Add animal <span style={{ fontSize: '18px' }}>→</span>
        </Hoverable>
      </div>

      <div style={{ display: 'flex', gap: '9px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={filterStyle(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <LoadingSpinner size="large" message="Loading animals…" />
        </div>
      ) : list.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '20px' }}>
          {list.map((a) => {
            const ti = typeInfo(a.type)
            return (
              <Hoverable
                key={a.id}
                onClick={() => navigate(`/animals/${a.id}`)}
                baseStyle={{
                  textAlign: 'left',
                  background: C.cream,
                  border: 'none',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)',
                  cursor: 'pointer',
                  transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),box-shadow .2s',
                }}
                hoverStyle={{ transform: 'scale(1.02)', boxShadow: '0 10px 20px -3px rgba(107,92,67,0.22)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                  <span style={{ display: 'inline-flex', width: '62px', height: '62px', background: ti.bg, borderRadius: '16px', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <AnimalIcon type={a.type} size={54} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontSize: '20px', lineHeight: 1.2 }}>{a.name}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '14px', color: C.tan }}>{ti.label} · {ageText(a.age)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  {a.is_sacrificed ? (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: C.tan, background: '#ECE7D2', border: '2px solid #C9BD9F', borderRadius: '9999px', padding: '3px 12px' }}>Sacrificed</span>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#2E7A48', background: '#E4F5E9', border: '2px solid #C7E9D2', borderRadius: '9999px', padding: '3px 12px' }}>Active</span>
                  )}
                  {eligible(a) && (
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#B8771A', background: '#FBF1DD', border: '2px solid #F5E2B8', borderRadius: '9999px', padding: '3px 12px' }}>Eligible</span>
                  )}
                </div>
              </Hoverable>
            )
          })}
        </div>
      ) : (
        <div style={{ background: C.cream, borderRadius: '16px', padding: '56px 24px', textAlign: 'center', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }}>
          <div style={{ width: '90px', height: '90px', margin: '0 auto 12px' }}>
            <AnimalIcon type="sheep" size={90} />
          </div>
          <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>No animals here yet</h3>
          <p style={{ margin: '0 0 20px', color: C.tan }}>Try another filter, or add your first animal.</p>
          <Hoverable onClick={() => navigate('/animals/add')} baseStyle={addBtnBase} hoverStyle={{ transform: 'scale(1.04)', background: C.brownDark }}>
            Add animal <span style={{ fontSize: '18px' }}>→</span>
          </Hoverable>
        </div>
      )}
    </div>
  )
}

export default Animals
