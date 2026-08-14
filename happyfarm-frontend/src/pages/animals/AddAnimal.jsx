import React, { useState } from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import { HfInput, TYPES, typeInfo, minAgeText } from '../../theme/hf.jsx'

const backBtnClass =
  'mb-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-line bg-cream ' +
  'px-[18px] py-2 font-display text-sm font-bold text-brown-text ' +
  'transition-transform duration-200 ease-pop hover:scale-[1.04]'

const choiceClass = (active) =>
  classNames(
    'flex cursor-pointer flex-col items-center rounded-2xl border-2 px-2 py-3.5 transition-all duration-200 ease-pop',
    active ? 'border-green bg-green-soft shadow-ribbon' : 'border-transparent bg-sand'
  )

const labelClass = 'mb-2 block text-sm font-semibold text-brown-text'

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
    <div className="mx-auto max-w-[680px] animate-hf-pop">
      <button onClick={() => navigate('/animals')} className={backBtnClass}>
        <span className="text-base">←</span> Back
      </button>

      <div className="rounded-2xl bg-cream p-7 shadow-ribbon">
        <h1 className="mb-1.5 text-3xl">Add a new animal</h1>
        <p className="mb-6 text-tan">Welcome a new friend to {farm?.name}.</p>

        <label className={labelClass}>Animal type</label>
        <div className="mb-[22px] grid grid-cols-2 gap-3 xs:grid-cols-4">
          {TYPES.map((t) => (
            <button key={t} onClick={() => setType(t)} className={choiceClass(type === t)}>
              <span className="mb-1 inline-flex h-[50px] w-[50px] items-center justify-center">
                <AnimalIcon type={t} size={50} />
              </span>
              <span className="block font-display text-[15px] font-bold text-brown-text">{typeInfo(t).label}</span>
            </button>
          ))}
        </div>

        <label htmlFor="an" className={labelClass}>Name or tag</label>
        <HfInput id="an" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whitey" className="mb-[18px]" />

        <label htmlFor="aa" className={labelClass}>Age (years)</label>
        <HfInput id="aa" type="number" min="0" step="0.1" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 1.5" className="mb-2.5" />
        <div className="mb-6 rounded-2xl border-[3px] border-yellow-line bg-yellow-badgeBg px-4 py-3">
          <p className="text-[13.5px] text-yellow-deep">
            🌙 {typeInfo(type).plural} are eligible for sacrifice at <strong>{minAgeText(type)}</strong> of age.
          </p>
        </div>

        <button
          onClick={submit}
          disabled={createMutation.isLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-brown p-3.5 font-display text-base font-bold text-white shadow-soft transition-all duration-200 ease-pop enabled:hover:scale-[1.02] enabled:hover:bg-brown-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {createMutation.isLoading ? 'Adding…' : 'Add to farm'} <span className="text-lg">→</span>
        </button>
      </div>
    </div>
  )
}

export default AddAnimal
