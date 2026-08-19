import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import ConfirmModal from '../../components/common/UI/ConfirmModal.jsx'
import { speciesBgClass, ageText, fmt, fmtDate, timeSince, badge, cardClass, HfInput, HfSelect } from '../../theme/hf.jsx'
import BreedingSection from './sections/BreedingSection.jsx'
import BirthsSection from './sections/BirthsSection.jsx'
import BirthModal from './sections/BirthModal.jsx'
import HealthRecordsSection from './sections/HealthRecordsSection.jsx'
import WeightHistorySection from './sections/WeightHistorySection.jsx'

const backBtnClass =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-line bg-cream ' +
  'px-[18px] py-2 font-display text-sm font-bold text-brown-text ' +
  'transition-transform duration-200 ease-pop hover:scale-[1.04]'

const ghostBtnClass =
  'cursor-pointer rounded-full border-2 border-line bg-cream px-4 py-2 font-display text-[13.5px] font-bold ' +
  'text-brown-text transition-transform duration-200 ease-pop hover:scale-[1.03]'

const dangerGhostBtnClass =
  'cursor-pointer rounded-full border-2 border-red-line bg-cream px-4 py-2 font-display text-[13.5px] font-bold ' +
  'text-red-dark transition-transform duration-200 ease-pop hover:scale-[1.03] hover:bg-red-soft'

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
  const [showDelete, setShowDelete] = useState(false)
  const [showExitForm, setShowExitForm] = useState(false)
  const [exitReason, setExitReason] = useState('death')
  const [exitDate, setExitDate] = useState(new Date().toISOString().slice(0, 10))
  const [birthModal, setBirthModal] = useState(null) // { cycleId } | null

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

  // Archives the animal if it has any history, otherwise deletes it
  // permanently — action tells us which, so the page reacts correctly
  // either way instead of guessing.
  const deleteMutation = useMutation(() => animalService.remove(id), {
    onSuccess: async (data) => {
      setShowDelete(false)
      await Promise.all([
        queryClient.invalidateQueries('animals'),
        queryClient.invalidateQueries('farm-details'),
        queryClient.invalidateQueries('farm-statistics'),
      ])
      if (data.action === 'archived') {
        await queryClient.invalidateQueries(['animal', id])
        toast.success(t('animalDetails.archivedToast', { name: animal?.name }))
      } else {
        toast.success(t('animalDetails.deletedToast', { name: animal?.name }))
        navigate('/animals')
      }
    },
    onError: () => setShowDelete(false),
  })

  const restoreMutation = useMutation(() => animalService.restore(id), {
    onSuccess: async () => {
      await invalidateAll()
      toast.success(t('animalDetails.restoredToast', { name: animal?.name }))
    },
  })

  const exitMutation = useMutation(() => animalService.recordExit(id, { reason: exitReason, exitDate }), {
    onSuccess: async () => {
      setShowExitForm(false)
      await invalidateAll()
      toast.success(t('animalDetails.exitedToast', { name: animal?.name }))
    },
  })

  const submitExit = () => {
    if (!exitDate) {
      toast.error(t('animalDetails.exitDateRequired'))
      return
    }
    exitMutation.mutate()
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
        <button onClick={() => navigate('/animals')} className={classNames(backBtnClass, 'mb-5')}>
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/animals')} className={backBtnClass}>
          <span className="text-base rtl:rotate-180">←</span> {t('common.backToAnimals')}
        </button>
        {!animal.is_archived && (
          <div className="flex gap-2.5">
            <button onClick={() => navigate(`/animals/${id}/edit`)} className={ghostBtnClass}>
              {t('animalDetails.edit')}
            </button>
            <button onClick={() => setShowDelete(true)} className={dangerGhostBtnClass}>
              {t('animalDetails.delete')}
            </button>
          </div>
        )}
      </div>

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
                {animal.is_archived ? (
                  <span className={badge('sacrificed', 'lg')}>{t('animals.filters.archived')}</span>
                ) : animal.is_sacrificed ? (
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

            {animal.is_archived ? (
              <div className="mt-3.5 rounded-2xl border-[3px] border-line bg-cream-muted p-[18px]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🗄️</span>
                    <div>
                      <h4 className="text-[15px] text-brown-text">{t('animalDetails.archivedBannerTitle')}</h4>
                      <p className="mt-[3px] text-sm text-brown">{t('animalDetails.archivedBannerBody')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => restoreMutation.mutate()}
                    disabled={restoreMutation.isLoading}
                    className="cursor-pointer rounded-full border-none bg-green px-5 py-2.5 font-display text-sm font-bold text-white shadow-chip transition-transform duration-200 ease-pop enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {restoreMutation.isLoading ? t('animalDetails.restoring') : t('animalDetails.restore')}
                  </button>
                </div>
              </div>
            ) : animal.is_sacrificed ? (
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
            ) : animal.exit_reason ? (
              <div className="mt-3.5 rounded-2xl bg-cream-muted p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] text-brown-text">{t('animalDetails.exitedPanelTitle')}</h4><span className="text-lg">📋</span>
                </div>
                <p className="text-sm font-semibold text-brown">{fmtDate(animal.exit_date, i18n.language)}</p>
                <p className="mt-[3px] text-[12.5px] text-tan">
                  {t('animalDetails.exit.reason')}: {t(`animalDetails.exit.${animal.exit_reason}`)}
                </p>
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

            {/* Withdrawal warning — surfaces animal.active_withdrawal, which
                is already the most conservative currently-active record;
                nothing here re-derives that. */}
            {animal.active_withdrawal && (
              <div className="mt-3.5 rounded-2xl border-[3px] border-red-line bg-red-soft p-[18px]">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="text-[15px] text-brown-text">{t('animalDetails.withdrawal.title')}</h4>
                    <p className="mt-[3px] text-sm text-brown">
                      {animal.active_withdrawal.product
                        ? t('animalDetails.withdrawal.bodyWithProduct', {
                            product: animal.active_withdrawal.product,
                            date: fmtDate(animal.active_withdrawal.withdrawal_until, i18n.language),
                          })
                        : t('animalDetails.withdrawal.bodyNoProduct', {
                            date: fmtDate(animal.active_withdrawal.withdrawal_until, i18n.language),
                          })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {animal.sex === 'female' && (
            <BreedingSection
              animal={animal}
              onRecordBirth={(cycle) => setBirthModal({ cycleId: cycle.id })}
            />
          )}

          {animal.sex === 'female' && (
            <BirthsSection
              dam={animal}
              onRecordBirth={() => setBirthModal({ cycleId: undefined })}
            />
          )}

          <HealthRecordsSection animalId={id} />

          <WeightHistorySection animalId={id} />
        </div>

        {/* Care actions */}
        <div className="rounded-2xl bg-green-soft p-6 shadow-ribbon">
          <h2 className="mb-[18px] text-[22px]">{t('animalDetails.care')}</h2>
          {animal.is_archived ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">🗄️</div>
              <p className="font-semibold text-brown">{t('animalDetails.archivedBannerBody')}</p>
            </div>
          ) : animal.is_sacrificed ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">🤲</div>
              <p className="font-semibold text-brown">{t('animalDetails.sacrificedCareMsg')}</p>
              <p className="mt-1.5 text-[13.5px] text-tan">{t('animalDetails.sacrificedCareSub')}</p>
            </div>
          ) : animal.exit_reason ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">📋</div>
              <p className="font-semibold text-brown">{t('animalDetails.exitedCareMsg')}</p>
              <p className="mt-1.5 text-[13.5px] text-tan">{t('animalDetails.exitedCareSub')}</p>
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

              <div className="my-1.5 h-px bg-line" />
              {showExitForm ? (
                <div className="rounded-2xl bg-cream p-4">
                  <label className="mb-1.5 block text-xs font-semibold text-brown-text">{t('animalDetails.exit.reason')}</label>
                  <HfSelect value={exitReason} onChange={(e) => setExitReason(e.target.value)} className="mb-3">
                    <option value="death">{t('animalDetails.exit.death')}</option>
                    <option value="sale">{t('animalDetails.exit.sale')}</option>
                  </HfSelect>
                  <label className="mb-1.5 block text-xs font-semibold text-brown-text">{t('animalDetails.exit.date')}</label>
                  <HfInput
                    type="date"
                    value={exitDate}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setExitDate(e.target.value)}
                    className="mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={submitExit}
                      disabled={exitMutation.isLoading}
                      className="flex-1 cursor-pointer rounded-full border-none bg-tan px-4 py-2.5 font-display text-sm font-bold text-white shadow-chip transition-transform duration-200 ease-pop enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {exitMutation.isLoading ? t('animalDetails.recordExitSubmitting') : t('animalDetails.recordExitSubmit')}
                    </button>
                    <button onClick={() => setShowExitForm(false)} className={ghostBtnClass}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowExitForm(true)}
                  className="text-center text-[13px] font-semibold text-tan underline decoration-dotted underline-offset-2"
                >
                  {t('animalDetails.recordExit')}
                </button>
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

      {birthModal && (
        <BirthModal
          dam={animal}
          initialCycleId={birthModal.cycleId}
          onClose={() => setBirthModal(null)}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title={t('animalDetails.deleteConfirmTitle', { name: animal.name })}
          body={t('animalDetails.deleteConfirmBody', { name: animal.name })}
          isConfirming={deleteMutation.isLoading}
          onCancel={() => setShowDelete(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}
    </div>
  )
}

export default AnimalDetails
