import React, { useState } from 'react'
import classNames from 'classnames'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { typeInfo, ageText, eligible, minAge, minAgeText, fmt, timeSince, badge, cardClass } from '../../theme/hf.jsx'

const backBtnClass =
  'mb-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-line bg-cream ' +
  'px-[18px] py-2 font-display text-sm font-bold text-brown-text ' +
  'transition-transform duration-200 ease-pop hover:scale-[1.04]'

const careBtnClass =
  'flex cursor-pointer items-center gap-2.5 rounded-full border-none px-5 py-[13px] ' +
  'font-display text-[15px] font-bold text-white shadow-soft ' +
  'transition-all duration-200 ease-pop enabled:hover:scale-[1.03] ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

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
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message="Loading animal…" />
      </div>
    )
  }

  if (error || !animal) {
    return (
      <div className="animate-hf-pop">
        <button onClick={() => navigate('/animals')} className={backBtnClass}>
          <span className="text-base">←</span> Back to animals
        </button>
        <div className={classNames(cardClass, 'p-7 text-center')}>
          <h3 className="mb-2 text-[22px]">Animal not found</h3>
          <p className="text-tan">This animal doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  const ti = typeInfo(animal.type)
  const elig = eligible(animal)
  const eligMsg = elig
    ? `Eligible for sacrifice (minimum ${minAgeText(animal.type)}).`
    : `Not yet eligible — needs ${(minAge(animal.type) - Number(animal.age)).toFixed(1)} more yr (minimum ${minAgeText(animal.type)}).`

  return (
    <div className="animate-hf-pop">
      <button onClick={() => navigate('/animals')} className={backBtnClass}>
        <span className="text-base">←</span> Back to animals
      </button>

      <div className="grid grid-cols-1 items-start gap-6 wide:grid-cols-[1.6fr_1fr]">
        {/* Main info */}
        <div className="flex flex-col gap-6">
          <div className={classNames(cardClass, 'p-7')}>
            <div className="flex flex-wrap items-center gap-[22px]">
              <span className={classNames('inline-flex h-[108px] w-[108px] flex-none items-center justify-center rounded-2xl shadow-[inset_0_0_0_6px_rgba(255,255,255,0.5)]', ti.bgClass)}>
                <AnimalIcon type={animal.type} size={92} />
              </span>
              <div>
                <h1 className="mb-1.5 text-[38px] leading-[1.05]">{animal.name}</h1>
                <p className="mb-1 text-lg text-brown">{ti.label} · {ageText(animal.age)} old</p>
                <p className="mb-3 text-[15px] text-tan">{ti.ar}</p>
                {animal.is_sacrificed ? (
                  <span className={badge('sacrificed', 'lg')}>Sacrificed</span>
                ) : (
                  <span className={badge('active', 'lg')}>● Active</span>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3.5 xs:grid-cols-2">
              <div className="rounded-2xl bg-blue-soft p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] text-blue-dark">Last fed</h4><span className="text-lg">🌾</span>
                </div>
                <p className="text-sm font-semibold text-blue-dark">{fmt(animal.fed_at)}</p>
                {animal.fed_at && <p className="mt-[3px] text-[12.5px] text-blue">{timeSince(animal.fed_at)}</p>}
              </div>
              <div className="rounded-2xl bg-green-badgeBg p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] text-green-badge">Last groomed</h4><span className="text-lg">✨</span>
                </div>
                <p className="text-sm font-semibold text-green-badge">{fmt(animal.groomed_at)}</p>
                {animal.groomed_at && <p className="mt-[3px] text-[12.5px] text-green-muted">{timeSince(animal.groomed_at)}</p>}
              </div>
            </div>

            {animal.is_sacrificed ? (
              <div className="mt-3.5 rounded-2xl bg-cream-muted p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] text-brown-text">Sacrificed</h4><span className="text-lg">🤲</span>
                </div>
                <p className="text-sm font-semibold text-brown">{fmt(animal.sacrificed_at)}</p>
                <p className="mt-[3px] text-[12.5px] text-tan">May it be accepted · تقبل الله</p>
              </div>
            ) : (
              <div
                className={classNames(
                  'mt-3.5 rounded-2xl border-[3px] bg-cream p-[18px]',
                  elig ? 'border-green-border' : 'border-yellow-line'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{elig ? '🌙' : '⏳'}</span>
                  <div>
                    <h4 className="text-[15px] text-brown-text">Sacrifice eligibility</h4>
                    <p className="mt-[3px] text-sm text-brown">{eligMsg}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Care actions */}
        <div className="rounded-2xl bg-green-soft p-6 shadow-ribbon">
          <h2 className="mb-[18px] text-[22px]">Care</h2>
          {animal.is_sacrificed ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">🤲</div>
              <p className="font-semibold text-brown">This animal has been sacrificed.</p>
              <p className="mt-1.5 text-[13.5px] text-tan">No further actions available.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => feedMutation.mutate()}
                disabled={feedMutation.isLoading}
                className={classNames(careBtnClass, 'bg-green enabled:hover:bg-green-dark')}
              >
                <span className="text-[17px]">🌾</span> Feed {animal.name}
              </button>
              <button
                onClick={() => groomMutation.mutate()}
                disabled={groomMutation.isLoading}
                className={classNames(careBtnClass, 'bg-blue enabled:hover:bg-blue-dark')}
              >
                <span className="text-[17px]">✨</span> Groom {animal.name}
              </button>
              <div className="my-1.5 h-px bg-line" />
              {elig ? (
                <button
                  onClick={() => setShowSacrifice(true)}
                  className={classNames(careBtnClass, 'bg-brown enabled:hover:bg-brown-dark')}
                >
                  🔪 Sacrifice {animal.name}
                </button>
              ) : (
                <>
                  <button
                    disabled
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-full border-none bg-disabled px-5 py-[13px] font-display text-[15px] font-bold text-disabled-text"
                  >
                    Not eligible yet
                  </button>
                  <p className="text-center text-[12.5px] text-tan">Must meet the minimum age for sacrifice.</p>
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
          className="fixed inset-0 z-50 flex animate-hf-fade items-center justify-center bg-scrim p-5 backdrop-blur-[3px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] animate-hf-modal overflow-hidden rounded-2xl bg-cream shadow-card"
          >
            <div className="px-7 pb-2 pt-7 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-red-soft text-[26px]">⚠️</div>
              <h3 className="mb-2 text-2xl">Sacrifice {animal.name}?</h3>
              <p className="mx-6 text-[15px] leading-relaxed text-brown">
                This marks the animal as sacrificed and cannot be undone. May it be accepted.
              </p>
            </div>
            <div className="flex gap-3 px-7 py-6">
              <button
                onClick={() => setShowSacrifice(false)}
                className="flex-1 cursor-pointer rounded-full border-2 border-line bg-cream p-3 font-display text-[15px] font-bold text-brown-text transition-transform duration-150 hover:scale-[1.03]"
              >
                Cancel
              </button>
              <button
                onClick={() => sacrificeMutation.mutate()}
                disabled={sacrificeMutation.isLoading}
                className="flex-1 cursor-pointer rounded-full border-none bg-red p-3 font-display text-[15px] font-bold text-white shadow-soft transition-all duration-150 enabled:hover:scale-[1.03] enabled:hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sacrificeMutation.isLoading ? 'Confirming…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimalDetails
