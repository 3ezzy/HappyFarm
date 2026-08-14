import React, { useState } from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import {
  TYPES,
  typeInfo,
  ageText,
  eligible,
  badgeSacrificed,
  badgeActive,
  badgeEligible,
} from '../../theme/hf.jsx'

const addBtnClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-full border-none bg-brown px-6 py-3 ' +
  'font-display text-[15px] font-bold text-white shadow-soft transition-all duration-200 ease-pop ' +
  'hover:scale-[1.04] hover:bg-brown-dark'

const filterClass = (active) =>
  classNames(
    'cursor-pointer rounded-full border-2 px-4 py-[7px] font-sans text-[13.5px] font-semibold transition-all duration-200',
    active ? 'border-green bg-green text-white' : 'border-line bg-cream text-brown'
  )

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
    <div className="animate-hf-pop">
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[34px]">Your animals</h1>
        <button onClick={() => navigate('/animals/add')} className={addBtnClass}>
          Add animal <span className="text-lg">→</span>
        </button>
      </div>

      <div className="mb-[22px] flex flex-wrap gap-[9px]">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filterClass(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" message="Loading animals…" />
        </div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {list.map((a) => {
            const ti = typeInfo(a.type)
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/animals/${a.id}`)}
                className="cursor-pointer rounded-2xl border-none bg-cream p-5 text-start shadow-ribbon transition-all duration-200 ease-pop hover:scale-[1.02] hover:shadow-toast"
              >
                <div className="mb-3.5 flex items-center gap-3.5">
                  <span className={classNames('inline-flex h-[62px] w-[62px] flex-none items-center justify-center rounded-2xl', ti.bgClass)}>
                    <AnimalIcon type={a.type} size={54} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl leading-tight">{a.name}</h3>
                    <p className="mt-0.5 text-sm text-tan">{ti.label} · {ageText(a.age)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {a.is_sacrificed ? (
                    <span className={badgeSacrificed}>Sacrificed</span>
                  ) : (
                    <span className={badgeActive}>Active</span>
                  )}
                  {eligible(a) && <span className={badgeEligible}>Eligible</span>}
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-cream px-6 py-14 text-center shadow-ribbon">
          <div className="mx-auto mb-3 h-[90px] w-[90px]">
            <AnimalIcon type="sheep" size={90} />
          </div>
          <h3 className="mb-2 text-2xl">No animals here yet</h3>
          <p className="mb-5 text-tan">Try another filter, or add your first animal.</p>
          <button onClick={() => navigate('/animals/add')} className={addBtnClass}>
            Add animal <span className="text-lg">→</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default Animals
