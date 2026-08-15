import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, speciesBgClass, ageText, fmt, fmtDate, timeSince, badge, cardClass } from '../../theme/hf.jsx'

const backBtnClass =
  'mb-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-line bg-cream ' +
  'px-[18px] py-2 font-display text-sm font-bold text-brown-text ' +
  'transition-transform duration-200 ease-pop hover:scale-[1.04]'

const careBtnClass =
  'flex cursor-pointer items-center gap-2.5 rounded-full border-none px-5 py-[13px] ' +
  'font-display text-[15px] font-bold text-white shadow-soft ' +
  'transition-all duration-200 ease-pop enabled:hover:scale-[1.03] ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

const ProfileField = ({ label, value, onClick }) => (
  <div>
    <p className="text-[13px] font-medium text-tan">{label}</p>
    {onClick ? (
      <button onClick={onClick} className="mt-0.5 font-display text-[15px] font-bold text-green underline decoration-dotted underline-offset-2">
        {value}
      </button>
    ) : (
      <p className="mt-0.5 font-display text-[15px] font-bold text-brown-text">{value}</p>
    )}
  </div>
)

const AnimalDetails = () => {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showSacrifice, setShowSacrifice] = useState(false)
  const [weightKg, setWeightKg] = useState('')
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 10))
  const [weightNotes, setWeightNotes] = useState('')

  const { data: animal, isLoading, error } = useQuery(['animal', id], () => animalService.getById(id), {
    refetchOnWindowFocus: true,
  })

  const { data: dam } = useQuery(
    ['animal', animal?.dam_id],
    () => animalService.getById(animal.dam_id),
    { enabled: !!animal?.dam_id }
  )
  const { data: sire } = useQuery(
    ['animal', animal?.sire_id],
    () => animalService.getById(animal.sire_id),
    { enabled: !!animal?.sire_id }
  )
  const { data: weights = [] } = useQuery(
    ['weights', id],
    () => animalService.getWeights(id),
    { enabled: !!animal }
  )

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
      toast.success(t('animalDetails.fedToast', { name: animal?.name }))
    },
  })
  const groomMutation = useMutation(() => animalService.groom(id), {
    onSuccess: async () => {
      await invalidateAll()
      toast.success(t('animalDetails.groomedToast', { name: animal?.name }))
    },
  })
  const sacrificeMutation = useMutation(() => animalService.sacrifice(id), {
    onSuccess: async () => {
      setShowSacrifice(false)
      await invalidateAll()
      toast.success(t('animalDetails.sacrificedToast', { name: animal?.name }))
    },
    onError: () => setShowSacrifice(false),
  })
  const addWeightMutation = useMutation((payload) => animalService.addWeight(id, payload), {
    onSuccess: async () => {
      await queryClient.invalidateQueries(['weights', id])
      setWeightKg('')
      setWeightNotes('')
    },
  })

  const submitWeight = () => {
    const parsed = parseFloat(weightKg)
    if (Number.isNaN(parsed) || parsed < 0 || !measuredAt) {
      toast.error(t('animalDetails.weights.weightRequired'))
      return
    }
    addWeightMutation.mutate({ weight_kg: parsed, measured_at: measuredAt, notes: weightNotes.trim() || undefined })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message={t('common.loading')} />
      </div>
    )
  }

  if (error || !animal) {
    return (
      <div className="animate-hf-pop">
        <button onClick={() => navigate('/animals')} className={backBtnClass}>
          <span className="text-base rtl:rotate-180">←</span> {t('common.backToAnimals')}
        </button>
        <div className={classNames(cardClass, 'p-7 text-center')}>
          <h3 className="mb-2 text-[22px]">{t('animalDetails.notFoundTitle')}</h3>
          <p className="text-tan">{t('animalDetails.notFoundBody')}</p>
        </div>
      </div>
    )
  }

  const speciesLabel = t(`species.${animal.type}.label`)
  const minAgeText = t(`minAge.${animal.type}`)
  const eligMsg = animal.is_eligible
    ? t('animalDetails.eligibleMsg', { minAge: minAgeText })
    : t('animalDetails.notEligibleMsg', { minAge: minAgeText })

  const sexLabel = animal.sex ? t(`animalDetails.profile.${animal.sex}`) : t('common.notRecorded')
  const originLabel = animal.origin ? t(`animalDetails.profile.${animal.origin}`) : t('common.notRecorded')
  const dobLabel = fmtDate(animal.date_of_birth, i18n.language) || t('common.notRecorded')
  const purchaseLabel = fmtDate(animal.date_of_purchase, i18n.language) || t('common.notRecorded')

  return (
    <div className="animate-hf-pop">
      <button onClick={() => navigate('/animals')} className={backBtnClass}>
        <span className="text-base rtl:rotate-180">←</span> {t('common.backToAnimals')}
      </button>

      <div className="grid grid-cols-1 items-start gap-6 wide:grid-cols-[1.6fr_1fr]">
        {/* Main info */}
        <div className="flex flex-col gap-6">
          <div className={classNames(cardClass, 'p-7')}>
            <div className="flex flex-wrap items-center gap-[22px]">
              <span className={classNames('inline-flex h-[108px] w-[108px] flex-none items-center justify-center rounded-2xl shadow-[inset_0_0_0_6px_rgba(255,255,255,0.5)]', speciesBgClass(animal.type))}>
                <AnimalIcon type={animal.type} size={92} />
              </span>
              <div>
                <h1 className="mb-1.5 text-[38px] leading-[1.05]">{animal.name}</h1>
                <p className="mb-3 text-lg text-brown">{t('animalDetails.ageLine', { type: speciesLabel, age: ageText(animal.age, t) })}</p>
                {animal.is_sacrificed ? (
                  <span className={badge('sacrificed', 'lg')}>{t('animalDetails.sacrificed')}</span>
                ) : (
                  <span className={badge('active', 'lg')}>{t('animalDetails.active')}</span>
                )}
              </div>
            </div>

            {/* Profile fields */}
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-line pt-5 xs:grid-cols-3">
              <ProfileField label={t('animalDetails.profile.tag')} value={animal.tag || t('common.notRecorded')} />
              <ProfileField label={t('animalDetails.profile.breed')} value={animal.breed || t('common.notRecorded')} />
              <ProfileField label={t('animalDetails.profile.sex')} value={sexLabel} />
              <ProfileField label={t('animalDetails.profile.dateOfBirth')} value={dobLabel} />
              <ProfileField label={t('animalDetails.profile.dateOfPurchase')} value={purchaseLabel} />
              <ProfileField label={t('animalDetails.profile.origin')} value={originLabel} />
              <ProfileField
                label={t('animalDetails.profile.dam')}
                value={dam ? dam.name : t('common.notRecorded')}
                onClick={animal.dam_id ? () => navigate(`/animals/${animal.dam_id}`) : undefined}
              />
              <ProfileField
                label={t('animalDetails.profile.sire')}
                value={sire ? sire.name : t('common.notRecorded')}
                onClick={animal.sire_id ? () => navigate(`/animals/${animal.sire_id}`) : undefined}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3.5 xs:grid-cols-2">
              <div className="rounded-2xl bg-blue-soft p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] text-blue-dark">{t('animalDetails.lastFed')}</h4><span className="text-lg">🌾</span>
                </div>
                <p className="text-sm font-semibold text-blue-dark">{fmt(animal.fed_at, i18n.language, t)}</p>
                {animal.fed_at && <p className="mt-[3px] text-[12.5px] text-blue">{timeSince(animal.fed_at, t)}</p>}
              </div>
              <div className="rounded-2xl bg-green-badgeBg p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] text-green-badge">{t('animalDetails.lastGroomed')}</h4><span className="text-lg">✨</span>
                </div>
                <p className="text-sm font-semibold text-green-badge">{fmt(animal.groomed_at, i18n.language, t)}</p>
                {animal.groomed_at && <p className="mt-[3px] text-[12.5px] text-green-muted">{timeSince(animal.groomed_at, t)}</p>}
              </div>
            </div>

            {animal.is_sacrificed ? (
              <div className="mt-3.5 rounded-2xl bg-cream-muted p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] text-brown-text">{t('animalDetails.sacrificedPanelTitle')}</h4><span className="text-lg">🤲</span>
                </div>
                <p className="text-sm font-semibold text-brown">{fmt(animal.sacrificed_at, i18n.language, t)}</p>
                {animal.exit_reason && (
                  <p className="mt-[3px] text-[12.5px] text-tan">
                    {t('animalDetails.exit.reason')}: {t(`animalDetails.exit.${animal.exit_reason}`)}
                  </p>
                )}
                <p className="mt-[3px] text-[12.5px] text-tan">{t('animalDetails.sacrificedNote')}</p>
              </div>
            ) : (
              <div
                className={classNames(
                  'mt-3.5 rounded-2xl border-[3px] bg-cream p-[18px]',
                  animal.is_eligible ? 'border-green-border' : 'border-yellow-line'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{animal.is_eligible ? '🌙' : '⏳'}</span>
                  <div>
                    <h4 className="text-[15px] text-brown-text">{t('animalDetails.eligibilityTitle')}</h4>
                    <p className="mt-[3px] text-sm text-brown">{eligMsg}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Weight history */}
          <div className={classNames(cardClass, 'p-7')}>
            <h2 className="mb-[18px] text-[22px]">{t('animalDetails.weights.title')}</h2>

            {weights.length === 0 ? (
              <p className="mb-4 text-sm text-tan">{t('animalDetails.weights.empty')}</p>
            ) : (
              <div className="mb-5 flex flex-col gap-2">
                {weights.map((w) => (
                  <div key={w.id} className="flex items-center justify-between gap-3 rounded-xl bg-green-soft2 px-4 py-2.5">
                    <span className="font-display text-base font-bold text-brown-text">{w.weight_kg} kg</span>
                    <span className="text-sm text-tan">{fmtDate(w.measured_at, i18n.language)}</span>
                    {w.notes && <span className="min-w-0 flex-1 truncate text-end text-[12.5px] text-tan">{w.notes}</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 xs:grid-cols-[1fr_1fr_2fr_auto] xs:items-end">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brown-text">{t('animalDetails.weights.weightKg')}</label>
                <HfInput type="number" min="0" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-brown-text">{t('animalDetails.weights.date')}</label>
                <HfInput type="date" value={measuredAt} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setMeasuredAt(e.target.value)} />
              </div>
              <div className="col-span-2 xs:col-span-1">
                <label className="mb-1.5 block text-xs font-semibold text-brown-text">{t('animalDetails.weights.notes')}</label>
                <HfInput type="text" value={weightNotes} onChange={(e) => setWeightNotes(e.target.value)} placeholder={t('animalDetails.weights.notesPlaceholder')} />
              </div>
              <button
                onClick={submitWeight}
                disabled={addWeightMutation.isLoading}
                className="col-span-2 h-[46px] cursor-pointer rounded-2xl border-none bg-green px-5 font-display text-sm font-bold text-white shadow-chip transition-transform duration-200 ease-pop enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70 xs:col-span-1"
              >
                {addWeightMutation.isLoading ? t('animalDetails.weights.saving') : t('animalDetails.weights.save')}
              </button>
            </div>
          </div>
        </div>

        {/* Care actions */}
        <div className="rounded-2xl bg-green-soft p-6 shadow-ribbon">
          <h2 className="mb-[18px] text-[22px]">{t('animalDetails.care')}</h2>
          {animal.is_sacrificed ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">🤲</div>
              <p className="font-semibold text-brown">{t('animalDetails.sacrificedCareMsg')}</p>
              <p className="mt-1.5 text-[13.5px] text-tan">{t('animalDetails.sacrificedCareSub')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => feedMutation.mutate()}
                disabled={feedMutation.isLoading}
                className={classNames(careBtnClass, 'bg-green enabled:hover:bg-green-dark')}
              >
                <span className="text-[17px]">🌾</span> {t('animalDetails.feed', { name: animal.name })}
              </button>
              <button
                onClick={() => groomMutation.mutate()}
                disabled={groomMutation.isLoading}
                className={classNames(careBtnClass, 'bg-blue enabled:hover:bg-blue-dark')}
              >
                <span className="text-[17px]">✨</span> {t('animalDetails.groom', { name: animal.name })}
              </button>
              <div className="my-1.5 h-px bg-line" />
              {animal.is_eligible ? (
                <button
                  onClick={() => setShowSacrifice(true)}
                  className={classNames(careBtnClass, 'bg-brown enabled:hover:bg-brown-dark')}
                >
                  🔪 {t('animalDetails.sacrifice', { name: animal.name })}
                </button>
              ) : (
                <>
                  <button
                    disabled
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-full border-none bg-disabled px-5 py-[13px] font-display text-[15px] font-bold text-disabled-text"
                  >
                    {t('animalDetails.notEligibleYet')}
                  </button>
                  <p className="text-center text-[12.5px] text-tan">{t('animalDetails.notEligibleHint')}</p>
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
              <h3 className="mb-2 text-2xl">{t('animalDetails.confirmSacrificeTitle', { name: animal.name })}</h3>
              <p className="mx-6 text-[15px] leading-relaxed text-brown">
                {t('animalDetails.confirmSacrificeBody')}
              </p>
            </div>
            <div className="flex gap-3 px-7 py-6">
              <button
                onClick={() => setShowSacrifice(false)}
                className="flex-1 cursor-pointer rounded-full border-2 border-line bg-cream p-3 font-display text-[15px] font-bold text-brown-text transition-transform duration-150 hover:scale-[1.03]"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => sacrificeMutation.mutate()}
                disabled={sacrificeMutation.isLoading}
                className="flex-1 cursor-pointer rounded-full border-none bg-red p-3 font-display text-[15px] font-bold text-white shadow-soft transition-all duration-150 enabled:hover:scale-[1.03] enabled:hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-70"
              >
                {sacrificeMutation.isLoading ? t('animalDetails.confirming') : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimalDetails
