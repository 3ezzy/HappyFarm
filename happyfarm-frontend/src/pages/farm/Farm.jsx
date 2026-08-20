import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { farmService } from '../../services/api/farm.js'
import { breedService } from '../../services/api/breeds.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import ConfirmModal from '../../components/common/UI/ConfirmModal.jsx'
import { TYPES, speciesBgClass, cardClass, HfInput, HfSelect } from '../../theme/hf.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const InfoItem = ({ emoji, iconClass, label, value, sub }) => (
  <div className="flex items-center gap-3.5">
    <span className={classNames('inline-flex h-12 w-12 items-center justify-center rounded-full text-[22px]', iconClass)}>
      {emoji}
    </span>
    <div>
      <p className="text-[13px] font-medium text-tan">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold text-brown-text">{value}</p>
      {sub && <p className="text-[12.5px] text-tan">{sub}</p>}
    </div>
  </div>
)

const MiniStat = ({ label, value, valueClass }) => (
  <div className={classNames(cardClass, 'p-5')}>
    <p className="mb-1 text-[13px] font-medium text-tan">{label}</p>
    <div className={classNames('font-display text-[32px] font-bold', valueClass)}>{value}</div>
  </div>
)

const CareRow = ({ emoji, label, value, valueClass }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-medium text-brown">{emoji} {label}</span>
    <span className={classNames('font-display text-lg font-bold', valueClass)}>{value}</span>
  </div>
)

const saveBtnClass =
  'cursor-pointer rounded-2xl border-none bg-green px-5 py-2.5 font-display text-sm font-bold text-white ' +
  'shadow-chip transition-transform duration-200 ease-pop enabled:hover:scale-[1.03] ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

const labelClass = 'mb-1.5 block text-xs font-semibold text-brown-text'

/**
 * Farm-owned custom breeds only — global/seeded breeds (farm_id null)
 * aren't shown here since they're read-only and already surface via the
 * animal form's breed dropdown without any management UI. Species is
 * disabled in the edit row once `in_use` is true, mirroring the backend's
 * own rule (BreedUpdateRequest) rather than only discovering it on submit.
 */
const CustomBreedsSection = () => {
  const { t } = useTranslation()
  const { farm } = useAuth()
  const queryClient = useQueryClient()

  const { data: allBreeds = [] } = useQuery('breeds', () => breedService.getAll())
  const myBreeds = allBreeds.filter((b) => b.farm_id === farm?.id)

  const [newSpecies, setNewSpecies] = useState('sheep')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editSpecies, setEditSpecies] = useState('sheep')
  const [editName, setEditName] = useState('')
  const [deletingBreed, setDeletingBreed] = useState(null)

  const invalidate = () => queryClient.invalidateQueries('breeds')

  const createMutation = useMutation((payload) => breedService.create(payload), {
    onSuccess: async () => {
      await invalidate()
      setNewName('')
      toast.success(t('farm.breeds.addedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const updateMutation = useMutation(({ id, payload }) => breedService.update(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setEditingId(null)
      toast.success(t('farm.breeds.updatedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const deleteMutation = useMutation((id) => breedService.remove(id), {
    onSuccess: async () => {
      await invalidate()
      setDeletingBreed(null)
      toast.success(t('farm.breeds.deletedToast'))
    },
    onError: (error) => {
      setDeletingBreed(null)
      toast.error(apiErrorMessage(error, t('common.error')))
    },
  })

  const submitNew = () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      toast.error(t('farm.breeds.nameRequired'))
      return
    }
    createMutation.mutate({ species: newSpecies, name: trimmed })
  }

  const startEdit = (b) => {
    setEditingId(b.id)
    setEditSpecies(b.species)
    setEditName(b.name)
  }

  const submitEdit = () => {
    const trimmed = editName.trim()
    if (!trimmed) {
      toast.error(t('farm.breeds.nameRequired'))
      return
    }
    updateMutation.mutate({ id: editingId, payload: { species: editSpecies, name: trimmed } })
  }

  return (
    <div className={classNames(cardClass, 'mt-6 p-6')}>
      <h2 className="mb-[18px] text-[22px]">{t('farm.breeds.title')}</h2>

      {myBreeds.length === 0 ? (
        <p className="mb-4 text-sm text-tan">{t('farm.breeds.empty')}</p>
      ) : (
        <div className="mb-5 flex flex-col gap-2">
          {myBreeds.map((b) => (
            <div key={b.id} className="rounded-xl bg-green-soft2 px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className={classNames('rounded-full px-2.5 py-0.5 text-xs font-semibold', speciesBgClass(b.species))}>
                  {t(`species.${b.species}.label`)}
                </span>
                <span className="min-w-0 flex-1 truncate font-display text-base font-bold text-brown-text">{b.name}</span>
                {b.in_use && <span className="flex-none text-[11px] font-semibold text-tan">{t('farm.breeds.inUse')}</span>}
                <div className="flex flex-none gap-2">
                  <button onClick={() => (editingId === b.id ? setEditingId(null) : startEdit(b))} className="text-[12.5px] font-semibold text-green underline decoration-dotted underline-offset-2">
                    {t('common.edit')}
                  </button>
                  <button
                    onClick={() => !b.in_use && setDeletingBreed(b)}
                    disabled={b.in_use}
                    className={classNames(
                      'text-[12.5px] font-semibold underline decoration-dotted underline-offset-2',
                      b.in_use ? 'cursor-not-allowed text-tan' : 'cursor-pointer text-red'
                    )}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>

              {editingId === b.id && (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 xs:grid-cols-[1fr_2fr_auto] xs:items-end">
                  <div>
                    <label className={labelClass}>{t('farm.breeds.species')}</label>
                    <HfSelect value={editSpecies} disabled={b.in_use} onChange={(e) => setEditSpecies(e.target.value)}>
                      {TYPES.map((type) => (
                        <option key={type} value={type}>{t(`species.${type}.label`)}</option>
                      ))}
                    </HfSelect>
                    {b.in_use && <p className="mt-1 text-[11px] text-tan">{t('farm.breeds.speciesLocked')}</p>}
                  </div>
                  <div className="col-span-2 xs:col-span-1">
                    <label className={labelClass}>{t('farm.breeds.name')}</label>
                    <HfInput type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <button onClick={submitEdit} disabled={updateMutation.isLoading} className={classNames(saveBtnClass, 'col-span-2 xs:col-span-1')}>
                    {updateMutation.isLoading ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xs:grid-cols-[1fr_2fr_auto] xs:items-end">
        <div>
          <label className={labelClass}>{t('farm.breeds.species')}</label>
          <HfSelect value={newSpecies} onChange={(e) => setNewSpecies(e.target.value)}>
            {TYPES.map((type) => (
              <option key={type} value={type}>{t(`species.${type}.label`)}</option>
            ))}
          </HfSelect>
        </div>
        <div className="col-span-2 xs:col-span-1">
          <label className={labelClass}>{t('farm.breeds.name')}</label>
          <HfInput type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('farm.breeds.namePlaceholder')} />
        </div>
        <button onClick={submitNew} disabled={createMutation.isLoading} className={classNames(saveBtnClass, 'col-span-2 xs:col-span-1')}>
          {createMutation.isLoading ? t('common.saving') : t('farm.breeds.add')}
        </button>
      </div>

      {deletingBreed && (
        <ConfirmModal
          title={t('farm.breeds.confirmDeleteTitle')}
          body={t('common.deleteWarning')}
          isConfirming={deleteMutation.isLoading}
          onCancel={() => setDeletingBreed(null)}
          onConfirm={() => deleteMutation.mutate(deletingBreed.id)}
        />
      )}
    </div>
  )
}

const Farm = () => {
  const { t } = useTranslation()
  const { farm: farmCtx, user } = useAuth()
  const { data: farm, isLoading } = useQuery('farm-details', farmService.getDetails, {
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message={t('common.loading')} />
      </div>
    )
  }

  const s = farm?.statistics || {}
  const total = s.total_animals || 0
  const sacrificedCount = s.sacrificed_animals || 0
  const readyCount = s.eligible_for_sacrifice || 0
  const activeCount = total - sacrificedCount
  const notEligibleCount = Math.max(0, total - sacrificedCount - readyCount)
  const fed24 = s.recently_fed || 0
  const groomed24 = s.recently_groomed || 0
  const byType = s.by_type || {}

  const farmName = farm?.name || farmCtx?.name
  const userName = farm?.owner?.name || user?.name
  const userEmail = farm?.owner?.email || user?.email
  const farmDays = farm?.created_at ? Math.max(0, Math.floor((Date.now() - new Date(farm.created_at).getTime()) / 86400000)) : 0

  return (
    <div className="animate-hf-pop">
      <h1 className="mb-[22px] text-[34px]">{farmName}</h1>

      <div className={classNames(cardClass, 'mb-6 p-6')}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5">
          <InfoItem emoji="🏡" iconClass="bg-green-soft" label={t('farm.farmName')} value={farmName} />
          <InfoItem emoji="👤" iconClass="bg-green-badgeBg" label={t('farm.owner')} value={userName} sub={userEmail} />
          <InfoItem emoji="📅" iconClass="bg-blue-soft" label={t('farm.farmAge')} value={t('farm.days', { count: farmDays })} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-5">
        <MiniStat label={t('farm.totalAnimals')} value={total} valueClass="text-brown-text" />
        <MiniStat label={t('farm.active')} value={activeCount} valueClass="text-green" />
        <MiniStat label={t('farm.readyForSacrifice')} value={readyCount} valueClass="text-yellow" />
        <MiniStat label={t('farm.sacrificed')} value={sacrificedCount} valueClass="text-tan" />
      </div>

      <div className="grid grid-cols-1 gap-6 wide:grid-cols-2">
        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">{t('farm.animalsByType')}</h2>
          <div className="grid grid-cols-2 gap-3 xs:grid-cols-4">
            {TYPES.map((type) => (
              <div key={type} className={classNames('rounded-2xl px-2 py-3.5 text-center', speciesBgClass(type))}>
                <div className="mx-auto mb-1 h-[46px] w-[46px]">
                  <AnimalIcon type={type} size={46} />
                </div>
                <div className="font-display text-xl font-bold text-brown-text">{byType[type] || 0}</div>
                <div className="text-xs text-tan">{t(`species.${type}.label`)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={classNames(cardClass, 'p-6')}>
          <h2 className="mb-[18px] text-[22px]">{t('farm.careStatus')}</h2>
          <div className="flex flex-col gap-3.5">
            <CareRow emoji="🌾" label={t('farm.fedLast24h')} value={fed24} valueClass="text-green" />
            <CareRow emoji="✨" label={t('farm.groomedLast24h')} value={groomed24} valueClass="text-blue" />
            <CareRow emoji="🌙" label={t('farm.eligibleForSacrifice')} value={readyCount} valueClass="text-yellow" />
            <CareRow emoji="⏳" label={t('farm.notYetEligible')} value={notEligibleCount} valueClass="text-tan" />
          </div>
        </div>
      </div>

      <CustomBreedsSection />
    </div>
  )
}

export default Farm
