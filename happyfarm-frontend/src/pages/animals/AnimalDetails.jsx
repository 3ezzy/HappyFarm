import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { C, Hoverable, typeInfo, ageText, eligible, minAge, minAgeText, fmt, timeSince } from '../../theme/hf.jsx'

const card = { background: C.cream, borderRadius: '16px', padding: '28px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }

const backBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: C.cream,
  color: C.brownText,
  fontFamily: "'Zilla Slab', serif",
  fontWeight: 700,
  fontSize: '14px',
  padding: '8px 18px',
  border: '2px solid #C9BD9F',
  borderRadius: '9999px',
  cursor: 'pointer',
  marginBottom: '20px',
  transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55)',
}

const careBtn = (bg, hoverBg) => ({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: bg,
    color: '#fff',
    fontFamily: "'Zilla Slab', serif",
    fontWeight: 700,
    fontSize: '15px',
    padding: '13px 20px',
    border: 'none',
    borderRadius: '9999px',
    boxShadow: '0 2px 4px rgba(107,92,67,0.16)',
    cursor: 'pointer',
    transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .2s',
  },
  hover: { transform: 'scale(1.03)', background: hoverBg },
})

const AnimalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showSacrifice, setShowSacrifice] = useState(false)

  const { data: animal, isLoading, error } = useQuery(['animal', id], () => animalService.getById(id), {
    refetchOnWindowFocus: true,
  })

  const invalidateAll = () =>
    Promise.all([
      queryClient.invalidateQueries(['animal', id]),
      queryClient.invalidateQueries('animals'),
      queryClient.invalidateQueries('farm-details'),
      queryClient.invalidateQueries('farm-statistics'),
    ])

  const feedMutation = useMutation(() => animalService.feed(id), {
    onSuccess: async () => {
      await invalidateAll()
      toast.success(`${animal?.name} has been fed! 🌾`)
    },
  })
  const groomMutation = useMutation(() => animalService.groom(id), {
    onSuccess: async () => {
      await invalidateAll()
      toast.success(`${animal?.name} looks lovely! ✨`)
    },
  })
  const sacrificeMutation = useMutation(() => animalService.sacrifice(id), {
    onSuccess: async () => {
      setShowSacrifice(false)
      await invalidateAll()
      toast.success(`${animal?.name} — may it be accepted. 🤲`)
    },
    onError: () => setShowSacrifice(false),
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <LoadingSpinner size="large" message="Loading animal…" />
      </div>
    )
  }

  if (error || !animal) {
    return (
      <div className="hf-anim-pop">
        <Hoverable as="button" onClick={() => navigate('/animals')} baseStyle={backBtn} hoverStyle={{ transform: 'scale(1.04)' }}>
          <span style={{ fontSize: '16px' }}>←</span> Back to animals
        </Hoverable>
        <div style={{ ...card, textAlign: 'center' }}>
          <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>Animal not found</h3>
          <p style={{ color: C.tan, margin: 0 }}>This animal doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  const ti = typeInfo(animal.type)
  const elig = eligible(animal)
  const notEligible = !animal.is_sacrificed && !elig
  const eligMsg = elig
    ? `Eligible for sacrifice (minimum ${minAgeText(animal.type)}).`
    : `Not yet eligible — needs ${(minAge(animal.type) - Number(animal.age)).toFixed(1)} more yr (minimum ${minAgeText(animal.type)}).`

  const feedC = careBtn(C.green, C.greenDark)
  const groomC = careBtn(C.blue, C.blueDark)
  const sacC = careBtn(C.brown, C.brownDark)

  return (
    <div className="hf-anim-pop">
      <Hoverable as="button" onClick={() => navigate('/animals')} baseStyle={backBtn} hoverStyle={{ transform: 'scale(1.04)' }}>
        <span style={{ fontSize: '16px' }}>←</span> Back to animals
      </Hoverable>

      <div className="hf-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Main info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', width: '108px', height: '108px', background: ti.bg, borderRadius: '16px', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: 'inset 0 0 0 6px rgba(255,255,255,0.5)' }}>
                <AnimalIcon type={animal.type} size={92} />
              </span>
              <div>
                <h1 style={{ fontSize: '38px', lineHeight: 1.05, marginBottom: '6px' }}>{animal.name}</h1>
                <p style={{ margin: '0 0 4px', fontSize: '18px', color: C.brown }}>{ti.label} · {ageText(animal.age)} old</p>
                <p style={{ margin: '0 0 12px', fontSize: '15px', color: C.tan }}>{ti.ar}</p>
                {animal.is_sacrificed ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: C.tan, background: '#ECE7D2', border: '2px solid #C9BD9F', borderRadius: '9999px', padding: '5px 14px' }}>Sacrificed</span>
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#2E7A48', background: '#E4F5E9', border: '2px solid #C7E9D2', borderRadius: '9999px', padding: '5px 14px' }}>● Active</span>
                )}
              </div>
            </div>

            <div className="hf-care-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '24px' }}>
              <div style={{ background: '#EAF2FB', borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '15px', color: C.blueDark }}>Last fed</h4><span style={{ fontSize: '18px' }}>🌾</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: C.blueDark, fontWeight: 600 }}>{fmt(animal.fed_at)}</p>
                {animal.fed_at && <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#68A1D7' }}>{timeSince(animal.fed_at)}</p>}
              </div>
              <div style={{ background: '#E4F5E9', borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '15px', color: '#2E7A48' }}>Last groomed</h4><span style={{ fontSize: '18px' }}>✨</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#2E7A48', fontWeight: 600 }}>{fmt(animal.groomed_at)}</p>
                {animal.groomed_at && <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#5Fae7e' }}>{timeSince(animal.groomed_at)}</p>}
              </div>
            </div>

            {animal.is_sacrificed ? (
              <div style={{ marginTop: '14px', background: '#ECE7D2', borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h4 style={{ fontSize: '15px', color: C.brownText }}>Sacrificed</h4><span style={{ fontSize: '18px' }}>🤲</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: C.brown, fontWeight: 600 }}>{fmt(animal.sacrificed_at)}</p>
                <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: C.tan }}>May it be accepted · تقبل الله</p>
              </div>
            ) : (
              <div style={{ marginTop: '14px', background: C.cream, border: `3px solid ${elig ? '#9BD9C2' : '#F5E2B8'}`, borderRadius: '16px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{elig ? '🌙' : '⏳'}</span>
                  <div>
                    <h4 style={{ fontSize: '15px', color: C.brownText }}>Sacrifice eligibility</h4>
                    <p style={{ margin: '3px 0 0', fontSize: '14px', color: C.brown }}>{eligMsg}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Care actions */}
        <div style={{ background: C.greenSoft, borderRadius: '16px', padding: '24px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }}>
          <h2 style={{ fontSize: '22px', marginBottom: '18px' }}>Care</h2>
          {animal.is_sacrificed ? (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🤲</div>
              <p style={{ margin: 0, color: C.brown, fontWeight: 600 }}>This animal has been sacrificed.</p>
              <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: C.tan }}>No further actions available.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Hoverable onClick={() => feedMutation.mutate()} disabled={feedMutation.isLoading} baseStyle={feedC.base} hoverStyle={feedC.hover}>
                <span style={{ fontSize: '17px' }}>🌾</span> Feed {animal.name}
              </Hoverable>
              <Hoverable onClick={() => groomMutation.mutate()} disabled={groomMutation.isLoading} baseStyle={groomC.base} hoverStyle={groomC.hover}>
                <span style={{ fontSize: '17px' }}>✨</span> Groom {animal.name}
              </Hoverable>
              <div style={{ height: '1px', background: C.border, margin: '6px 0' }} />
              {elig ? (
                <Hoverable onClick={() => setShowSacrifice(true)} baseStyle={sacC.base} hoverStyle={sacC.hover}>
                  🔪 Sacrifice {animal.name}
                </Hoverable>
              ) : (
                <>
                  <button disabled style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#ECE9DC', color: '#A99E86', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '15px', padding: '13px 20px', border: 'none', borderRadius: '9999px', cursor: 'not-allowed' }}>
                    Not eligible yet
                  </button>
                  <p style={{ margin: 0, fontSize: '12.5px', color: C.tan, textAlign: 'center' }}>Must meet the minimum age for sacrifice.</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sacrifice modal */}
      {showSacrifice && (
        <div
          onClick={() => setShowSacrifice(false)}
          className="hf-anim-fade"
          style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(58,47,32,0.5)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '420px', background: C.cream, borderRadius: '16px', boxShadow: '0 16px 30px -5px rgba(107,92,67,0.26)', overflow: 'hidden', animation: 'hf-modal .4s cubic-bezier(0.68,-0.55,0.265,1.55) both' }}
          >
            <div style={{ padding: '28px 28px 8px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', margin: '0 auto 14px', background: '#FCE7E5', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>⚠️</div>
              <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>Sacrifice {animal.name}?</h3>
              <p style={{ margin: '0 24px', fontSize: '15px', color: C.brown, lineHeight: 1.6 }}>This marks the animal as sacrificed and cannot be undone. May it be accepted.</p>
            </div>
            <div style={{ display: 'flex', gap: '12px', padding: '24px 28px' }}>
              <Hoverable
                onClick={() => setShowSacrifice(false)}
                baseStyle={{ flex: 1, background: C.cream, color: C.brownText, fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '15px', padding: '12px', border: '2px solid #C9BD9F', borderRadius: '9999px', cursor: 'pointer', transition: 'transform .15s' }}
                hoverStyle={{ transform: 'scale(1.03)' }}
              >
                Cancel
              </Hoverable>
              <Hoverable
                onClick={() => sacrificeMutation.mutate()}
                disabled={sacrificeMutation.isLoading}
                baseStyle={{ flex: 1, background: C.red, color: '#fff', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '15px', padding: '12px', border: 'none', borderRadius: '9999px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(107,92,67,0.16)', transition: 'transform .15s,background-color .2s' }}
                hoverStyle={{ transform: 'scale(1.03)', background: C.redDark }}
              >
                {sacrificeMutation.isLoading ? 'Confirming…' : 'Confirm'}
              </Hoverable>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimalDetails
