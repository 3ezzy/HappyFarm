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
import { speciesBgClass, ageText, fmt, fmtDate, timeSince, badge, cardClass, HfInput, HfSelect, btnSecondary, btnDangerGhost, AlertRow } from '../../theme/hf.jsx'
import BreedingSection from './sections/BreedingSection.jsx'
import BirthsSection from './sections/BirthsSection.jsx'
import BirthModal from './sections/BirthModal.jsx'
import HealthRecordsSection from './sections/HealthRecordsSection.jsx'
import WeightHistorySection from './sections/WeightHistorySection.jsx'

const careBtnClass =
  'flex cursor-pointer items-center gap-2.5 rounded border-none px-5 py-[13px] ' +
  'text-[15px] font-medium text-white transition-colors duration-hf ' +
  'enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45'

const ProfileField = ({ label, value, onClick }) => (
  <div>
    <p className="text-[13px] font-medium text-ink-500">{label}</p>
    {onClick ? (
      <button onClick={onClick} className="mt-0.5 font-display text-[15px] font-semibold text-meadow-700 underline decoration-dotted underline-offset-2">
        {value}
      </button>
    ) : (
      <p className="mt-0.5 font-display text-[15px] font-semibold text-ink-900">{value}</p>
    )}
  </div>
)

/** Pedigree rail — dam/sire only. Kept separate from the generic profile
 *  fields grid since these two are navigable relationships, not plain data. */
const PedigreeNode = ({ role, animal, onClick }) => {
  const inner = (
    <>
      <span className="role">{role}</span>
      <span className={classNames('name', !animal && 'empty')}>{animal ? animal.name : '—'}</span>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} className="node link">{inner}</button>
  ) : (
    <div className="node">{inner}</div>
  )
}

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
      <div>
        <button onClick={() => navigate('/animals')} className={classNames(btnSecondary, 'mb-5')}>
          <span className="text-base rtl:rotate-180">←</span> {t('common.backToAnimals')}
        </button>
        <div className={classNames(cardClass, 'p-7 text-center')}>
          <h3 className="mb-2 text-[22px]">{t('animalDetails.notFoundTitle')}</h3>
          <p className="text-ink-500">{t('animalDetails.notFoundBody')}</p>
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
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => navigate('/animals')} className={btnSecondary}>
          <span className="text-base rtl:rotate-180">←</span> {t('common.backToAnimals')}
        </button>
        {!animal.is_archived && (
          <div className="flex gap-2.5">
            <button onClick={() => navigate(`/animals/${id}/edit`)} className={btnSecondary}>
              {t('animalDetails.edit')}
            </button>
            <button onClick={() => setShowDelete(true)} className={btnDangerGhost}>
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
              <span className={classNames('inline-flex h-[108px] w-[108px] flex-none items-center justify-center rounded-lg', speciesBgClass(animal.type))}>
                <AnimalIcon type={animal.type} size={92} />
              </span>
              <div>
                <h1 className="mb-1.5 text-[38px] leading-[1.05]">{animal.name}</h1>
                <p className="mb-3 text-lg text-ink-500">{t('animalDetails.ageLine', { type: speciesLabel, age: ageText(animal.age, t) })}</p>
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
            </div>

            {/* Pedigree rail */}
            <div className="hf-ped mt-4">
              <PedigreeNode
                role={t('animalDetails.profile.dam')}
                animal={dam}
                onClick={animal.dam_id ? () => navigate(`/animals/${animal.dam_id}`) : undefined}
              />
              <PedigreeNode
                role={t('animalDetails.profile.sire')}
                animal={sire}
                onClick={animal.sire_id ? () => navigate(`/animals/${animal.sire_id}`) : undefined}
              />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3.5 xs:grid-cols-2">
              <div className="rounded-lg bg-info-bg p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] font-medium text-info-fg">{t('animalDetails.lastFed')}</h4><span className="text-lg">🌾</span>
                </div>
                <p className="text-sm font-semibold text-ink-900">{fmt(animal.fed_at, i18n.language, t)}</p>
                {animal.fed_at && <p className="mt-[3px] text-[12.5px] text-ink-500">{timeSince(animal.fed_at, t)}</p>}
              </div>
              <div className="rounded-lg bg-ok-bg p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] font-medium text-ok-fg">{t('animalDetails.lastGroomed')}</h4><span className="text-lg">✨</span>
                </div>
                <p className="text-sm font-semibold text-ink-900">{fmt(animal.groomed_at, i18n.language, t)}</p>
                {animal.groomed_at && <p className="mt-[3px] text-[12.5px] text-ink-500">{timeSince(animal.groomed_at, t)}</p>}
              </div>
            </div>

            {animal.is_archived ? (
              <AlertRow
                className="mt-3.5"
                title={t('animalDetails.archivedBannerTitle')}
                detail={t('animalDetails.archivedBannerBody')}
                actions={
                  <button
                    onClick={() => restoreMutation.mutate()}
                    disabled={restoreMutation.isLoading}
                    className="cursor-pointer rounded border-none bg-meadow-700 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-hf enabled:hover:bg-meadow-900 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {restoreMutation.isLoading ? t('animalDetails.restoring') : t('animalDetails.restore')}
                  </button>
                }
              />
            ) : animal.is_sacrificed ? (
              <div className="mt-3.5 rounded-lg border border-line bg-surface-sunken p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] font-medium text-ink-900">{t('animalDetails.sacrificedPanelTitle')}</h4><span className="text-lg">🤲</span>
                </div>
                <p className="text-sm font-semibold text-ink-700">{fmt(animal.sacrificed_at, i18n.language, t)}</p>
                {animal.exit_reason && (
                  <p className="mt-[3px] text-[12.5px] text-ink-500">
                    {t('animalDetails.exit.reason')}: {t(`animalDetails.exit.${animal.exit_reason}`)}
                  </p>
                )}
                <p className="mt-[3px] text-[12.5px] text-ink-500">{t('animalDetails.sacrificedNote')}</p>
              </div>
            ) : animal.exit_reason ? (
              <div className="mt-3.5 rounded-lg border border-line bg-surface-sunken p-[18px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <h4 className="text-[15px] font-medium text-ink-900">{t('animalDetails.exitedPanelTitle')}</h4><span className="text-lg">📋</span>
                </div>
                <p className="text-sm font-semibold text-ink-700">{fmtDate(animal.exit_date, i18n.language)}</p>
                <p className="mt-[3px] text-[12.5px] text-ink-500">
                  {t('animalDetails.exit.reason')}: {t(`animalDetails.exit.${animal.exit_reason}`)}
                </p>
              </div>
            ) : (
              <div
                className={classNames(
                  'mt-3.5 rounded-lg border p-[18px]',
                  animal.is_eligible ? 'border-ok-fg/25 bg-ok-bg' : 'border-warn-fg/25 bg-warn-bg'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{animal.is_eligible ? '🌙' : '⏳'}</span>
                  <div>
                    <h4 className="text-[15px] font-medium text-ink-900">{t('animalDetails.eligibilityTitle')}</h4>
                    <p className="mt-[3px] text-sm text-ink-700">{eligMsg}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawal warning — surfaces animal.active_withdrawal, which
                is already the most conservative currently-active record;
                nothing here re-derives that. */}
            {animal.active_withdrawal && (
              <AlertRow
                severity="danger"
                className="mt-3.5"
                title={t('animalDetails.withdrawal.title')}
                detail={
                  animal.active_withdrawal.product
                    ? t('animalDetails.withdrawal.bodyWithProduct', {
                        product: animal.active_withdrawal.product,
                        date: fmtDate(animal.active_withdrawal.withdrawal_until, i18n.language),
                      })
                    : t('animalDetails.withdrawal.bodyNoProduct', {
                        date: fmtDate(animal.active_withdrawal.withdrawal_until, i18n.language),
                      })
                }
              />
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
        <div className="rounded-lg border border-line bg-surface-card p-6 shadow-e1">
          <h2 className="mb-[18px] text-[22px]">{t('animalDetails.care')}</h2>
          {animal.is_archived ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">🗄️</div>
              <p className="font-semibold text-ink-700">{t('animalDetails.archivedBannerBody')}</p>
            </div>
          ) : animal.is_sacrificed ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">🤲</div>
              <p className="font-semibold text-ink-700">{t('animalDetails.sacrificedCareMsg')}</p>
              <p className="mt-1.5 text-[13.5px] text-ink-500">{t('animalDetails.sacrificedCareSub')}</p>
            </div>
          ) : animal.exit_reason ? (
            <div className="px-2 py-6 text-center">
              <div className="mb-2.5 text-[40px]">📋</div>
              <p className="font-semibold text-ink-700">{t('animalDetails.exitedCareMsg')}</p>
              <p className="mt-1.5 text-[13.5px] text-ink-500">{t('animalDetails.exitedCareSub')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => feedMutation.mutate()}
                disabled={feedMutation.isLoading}
                className={classNames(careBtnClass, 'bg-meadow-700 enabled:hover:bg-meadow-900')}
              >
                <span className="text-[17px]">🌾</span> {t('animalDetails.feed', { name: animal.name })}
              </button>
              <button
                onClick={() => groomMutation.mutate()}
                disabled={groomMutation.isLoading}
                className={classNames(careBtnClass, 'bg-info-fg enabled:hover:brightness-110')}
              >
                <span className="text-[17px]">✨</span> {t('animalDetails.groom', { name: animal.name })}
              </button>
              <div className="my-1.5 h-px bg-line" />
              {animal.is_eligible ? (
                <button
                  onClick={() => setShowSacrifice(true)}
                  className={classNames(careBtnClass, 'bg-danger-fg enabled:hover:brightness-110')}
                >
                  🔪 {t('animalDetails.sacrifice', { name: animal.name })}
                </button>
              ) : (
                <>
                  <button
                    disabled
                    className="flex cursor-not-allowed items-center gap-2.5 rounded border border-line-strong bg-surface-sunken px-5 py-[13px] text-[15px] font-medium text-ink-400"
                  >
                    {t('animalDetails.notEligibleYet')}
                  </button>
                  <p className="text-center text-[12.5px] text-ink-500">{t('animalDetails.notEligibleHint')}</p>
                </>
              )}

              <div className="my-1.5 h-px bg-line" />
              {showExitForm ? (
                <div className="rounded-lg border border-line bg-surface-sunken p-4">
                  <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.exit.reason')}</label>
                  <HfSelect value={exitReason} onChange={(e) => setExitReason(e.target.value)} className="mb-3">
                    <option value="death">{t('animalDetails.exit.death')}</option>
                    <option value="sale">{t('animalDetails.exit.sale')}</option>
                  </HfSelect>
                  <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.exit.date')}</label>
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
                      className="flex-1 cursor-pointer rounded border-none bg-ink-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-hf enabled:hover:bg-ink-900 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {exitMutation.isLoading ? t('animalDetails.recordExitSubmitting') : t('animalDetails.recordExitSubmit')}
                    </button>
                    <button onClick={() => setShowExitForm(false)} className={classNames(btnSecondary, 'flex-1')}>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowExitForm(true)}
                  className="text-center text-[13px] font-medium text-ink-500 underline decoration-dotted underline-offset-2"
                >
                  {t('animalDetails.recordExit')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showSacrifice && (
        <ConfirmModal
          title={t('animalDetails.confirmSacrificeTitle', { name: animal.name })}
          body={t('animalDetails.confirmSacrificeBody')}
          loadingLabel={t('animalDetails.confirming')}
          isConfirming={sacrificeMutation.isLoading}
          onCancel={() => setShowSacrifice(false)}
          onConfirm={() => sacrificeMutation.mutate()}
        />
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
