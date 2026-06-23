import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import { C, Hoverable, HfInput, TYPES, typeInfo, minAgeText } from '../../theme/hf.jsx'

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

const choiceStyle = (active) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '14px 8px',
  borderRadius: '16px',
  transition: 'transform .18s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .18s,box-shadow .18s',
  border: `2px solid ${active ? C.green : 'transparent'}`,
  background: active ? C.greenSoft : C.sand,
  boxShadow: active ? '0 4px 10px -1px rgba(107,92,67,0.20)' : 'none',
})

const labelStyle = { display: 'block', fontSize: '14px', fontWeight: 600, color: C.brownText, marginBottom: '8px' }

const AddAnimal = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { farm } = useAuth()

  const [type, setType] = useState('sheep')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')

  const createMutation = useMutation(animalService.create, {
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries('animals'),
        queryClient.invalidateQueries('farm-details'),
        queryClient.invalidateQueries('farm-statistics'),
      ])
      toast.success(`${data.name} joined the farm! 🌿`)
      navigate('/animals')
    },
  })

  const submit = () => {
    const trimmed = name.trim()
    const parsed = parseFloat(age)
    if (!trimmed) {
      toast.error('Please give your animal a name.')
      return
    }
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Please enter a valid age.')
      return
    }
    createMutation.mutate({ type, name: trimmed, age: parsed })
  }

  return (
    <div className="hf-anim-pop" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <Hoverable as="button" onClick={() => navigate('/animals')} baseStyle={backBtn} hoverStyle={{ transform: 'scale(1.04)' }}>
        <span style={{ fontSize: '16px' }}>←</span> Back
      </Hoverable>

      <div style={{ background: C.cream, borderRadius: '16px', padding: '28px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }}>
        <h1 style={{ fontSize: '30px', marginBottom: '6px' }}>Add a new animal</h1>
        <p style={{ margin: '0 0 24px', color: C.tan }}>Welcome a new friend to {farm?.name}.</p>

        <label style={labelStyle}>Animal type</label>
        <div className="hf-type-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '22px' }}>
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} style={choiceStyle(type === t)}>
              <span style={{ display: 'inline-flex', width: '50px', height: '50px', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                <AnimalIcon type={t} size={50} />
              </span>
              <span style={{ display: 'block', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '15px', color: C.brownText }}>{typeInfo(t).label}</span>
            </button>
          ))}
        </div>

        <label htmlFor="an" style={labelStyle}>Name or tag</label>
        <HfInput id="an" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whitey" style={{ marginBottom: '18px' }} />

        <label htmlFor="aa" style={labelStyle}>Age (years)</label>
        <HfInput id="aa" type="number" min="0" step="0.1" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 1.5" style={{ marginBottom: '10px' }} />
        <div style={{ background: '#FBF1DD', border: '3px solid #F5E2B8', borderRadius: '16px', padding: '12px 16px', marginBottom: '24px' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: '#8A5912' }}>
            🌙 {typeInfo(type).plural} are eligible for sacrifice at <strong>{minAgeText(type)}</strong> of age.
          </p>
        </div>

        <Hoverable
          onClick={submit}
          disabled={createMutation.isLoading}
          baseStyle={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            background: C.brown,
            color: '#fff',
            fontFamily: "'Zilla Slab', serif",
            fontWeight: 700,
            fontSize: '16px',
            padding: '14px',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: '0 2px 4px rgba(107,92,67,0.16)',
            cursor: 'pointer',
            opacity: createMutation.isLoading ? 0.7 : 1,
            transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .2s',
          }}
          hoverStyle={{ transform: 'scale(1.02)', background: C.brownDark }}
        >
          {createMutation.isLoading ? 'Adding…' : 'Add to farm'} <span style={{ fontSize: '18px' }}>→</span>
        </Hoverable>
      </div>
    </div>
  )
}

export default AddAnimal
