import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { birthService } from '../../../services/api/births.js'
import { breedingCycleService } from '../../../services/api/breedingCycles.js'
import { animalService } from '../../../services/api/animals.js'
import ConfirmModal from '../../../components/common/UI/ConfirmModal.jsx'
import LoadingSpinner from '../../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, HfSelect, fmtDate, cardClass } from '../../../theme/hf.jsx'
import { apiErrorMessage } from '../../../utils/apiError.js'

const today = () => new Date().toISOString().slice(0, 10)
const fieldLabel = 'mb-1.5 block text-xs font-semibold text-brown-text'

const actionBtnClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-full border-none bg-green px-5 py-2.5 ' +
  'font-display text-sm font-bold text-white shadow-chip transition-transform duration-200 ease-pop ' +
  'enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70'

const ghostBtnClass =
  'cursor-pointer rounded-full border-2 border-line bg-cream px-4 py-2 font-display text-[13.5px] font-bold ' +
  'text-brown-text transition-transform duration-200 ease-pop hover:scale-[1.03]'

const EditBirthForm = ({ birth, cycles, sires, onSave, onCancel, isSaving }) => {
  const { t } = useTranslation()
  const [cycleId, setCycleId] = useState(birth.breeding_cycle_id ? String(birth.breeding_cycle_id) : '')
  const [sireId, setSireId] = useState(birth.sire_id ? String(birth.sire_id) : '')
  const [bornOn, setBornOn] = useState(birth.born_on)
  const [total, setTotal] = useState(String(birth.offspring_total))
  const [alive, setAlive] = useState(String(birth.offspring_alive))
  const [difficulty, setDifficulty] = useState(birth.difficulty || '')
  const [notes, setNotes] = useState(birth.notes || '')

  // The cycle this birth already belongs to might no longer be "open" (it
  // has this birth), so it needs to stay selectable even though it's not
  // in the general open-cycles list.
  const options = cycles.some((c) => String(c.id) === cycleId)
    ? cycles
    : [...cycles, ...(birth.breeding_cycle_id ? [{ id: birth.breeding_cycle_id, bred_on: '', sire_name: null }] : [])]

  const submit = () => {
    const totalNum = parseInt(total, 10)
    const aliveNum = parseInt(alive, 10)

    if (Number.isNaN(totalNum) || totalNum < 0 || Number.isNaN(aliveNum) || aliveNum < 0) {
      toast.error(t('births.offspringCountsRequired'))
      return
    }
    if (aliveNum > totalNum) {
      toast.error(t('births.aliveExceedsTotal'))
      return
    }

    onSave({
      breeding_cycle_id: cycleId || undefined,
      sire_id: sireId || undefined,
      born_on: bornOn,
      offspring_total: totalNum,
      offspring_alive: aliveNum,
      difficulty: difficulty || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-sand p-4 xs:grid-cols-3">
      <div>
        <label className={fieldLabel}>{t('births.cycle')}</label>
        <HfSelect value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
          <option value="">{t('births.cycleNone')}</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>{c.bred_on || `#${c.id}`}{c.sire_name ? ` — ${c.sire_name}` : ''}</option>
          ))}
        </HfSelect>
      </div>
      <div>
        <label className={fieldLabel}>{t('births.sire')}</label>
        <HfSelect value={sireId} onChange={(e) => setSireId(e.target.value)}>
          <option value="">{t('births.sireOptional')}</option>
          {sires.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </HfSelect>
      </div>
      <div>
        <label className={fieldLabel}>{t('births.bornOn')}</label>
        <HfInput type="date" value={bornOn} max={today()} onChange={(e) => setBornOn(e.target.value)} />
      </div>
      <div>
        <label className={fieldLabel}>{t('births.offspringTotal')}</label>
        <HfInput type="number" min="0" step="1" value={total} onChange={(e) => setTotal(e.target.value)} />
      </div>
      <div>
        <label className={fieldLabel}>{t('births.offspringAlive')}</label>
        <HfInput type="number" min="0" step="1" value={alive} onChange={(e) => setAlive(e.target.value)} />
      </div>
      <div>
        <label className={fieldLabel}>{t('births.difficulty.label')}</label>
        <HfSelect value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">{t('births.difficulty.select')}</option>
          <option value="easy">{t('births.difficulty.easy')}</option>
          <option value="assisted">{t('births.difficulty.assisted')}</option>
          <option value="difficult">{t('births.difficulty.difficult')}</option>
          <option value="cesarean">{t('births.difficulty.cesarean')}</option>
        </HfSelect>
      </div>
      <div className="xs:col-span-3">
        <label className={fieldLabel}>{t('births.notes')}</label>
        <HfInput type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('births.notesPlaceholder')} />
      </div>
      <div className="flex gap-2 xs:col-span-3">
        <button
          onClick={submit}
          disabled={isSaving}
          className={actionBtnClass}
        >
          {isSaving ? t('common.saving') : t('common.save')}
        </button>
        <button onClick={onCancel} className={ghostBtnClass}>{t('common.cancel')}</button>
      </div>
    </div>
  )
}

/**
 * Births already recorded for this dam. Deleting one never deletes the
 * animals it produced — the backend only clears their birth_id
 * (nullOnDelete) — the confirm copy says so explicitly.
 */
const BirthsSection = ({ dam, onRecordBirth }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [editingBirth, setEditingBirth] = useState(null)
  const [deletingBirth, setDeletingBirth] = useState(null)

  const { data: births = [], isLoading } = useQuery(['births', dam.id], () => birthService.getAll(dam.id))
  const { data: cycles = [] } = useQuery(['breeding-cycles', dam.id], () => breedingCycleService.getAll(dam.id))
  const { data: animals = [] } = useQuery('animals', () => animalService.getAll())
  const sires = animals.filter((a) => a.sex === 'male')
  const openCycles = cycles.filter((c) => !c.birth_id)

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries(['births', dam.id]),
      queryClient.invalidateQueries(['breeding-cycles', dam.id]),
      queryClient.invalidateQueries(['animal', dam.id]),
      queryClient.invalidateQueries('animals'),
    ])

  const updateMutation = useMutation(({ id, payload }) => birthService.update(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setEditingBirth(null)
      toast.success(t('births.updated'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const deleteMutation = useMutation((id) => birthService.remove(id), {
    onSuccess: async () => {
      await invalidate()
      setDeletingBirth(null)
      toast.success(t('births.deleted'))
    },
    onError: (error) => {
      setDeletingBirth(null)
      toast.error(apiErrorMessage(error, t('common.error')))
    },
  })

  return (
    <div className={classNames(cardClass, 'p-7')}>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px]">{t('births.title')}</h2>
        <button onClick={onRecordBirth} className={actionBtnClass}>{t('births.recordBirth')}</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6"><LoadingSpinner message={t('common.loading')} /></div>
      ) : births.length === 0 ? (
        <p className="text-sm text-tan">{t('births.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {births.map((b) => (
            <div key={b.id} className="rounded-xl bg-sand px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-display text-base font-bold text-brown-text">{fmtDate(b.born_on, i18n.language)}</span>
                  <span className="ms-2 text-[13px] text-tan">
                    {t('births.offspringAlive')}: {b.offspring_alive} / {t('births.offspringTotal').toLowerCase()}: {b.offspring_total}
                  </span>
                  {b.difficulty && <span className="ms-2 text-[13px] text-tan">· {t(`births.difficulty.${b.difficulty}`)}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingBirth(editingBirth === b.id ? null : b.id)} className="text-[12.5px] font-semibold text-green underline decoration-dotted underline-offset-2">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => setDeletingBirth(b)} className="text-[12.5px] font-semibold text-red underline decoration-dotted underline-offset-2">
                    {t('common.delete')}
                  </button>
                </div>
              </div>

              {b.sire_name && <p className="mt-1 text-[12.5px] text-tan">{t('births.sire')}: {b.sire_name}</p>}
              {b.notes && <p className="mt-1 text-[12.5px] text-tan">{b.notes}</p>}

              {b.animals?.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {b.animals.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => navigate(`/animals/${a.id}`)}
                      className="cursor-pointer rounded-full border border-green-line bg-green-badgeBg px-3 py-1 text-[12.5px] font-semibold text-green-badge transition-transform duration-150 hover:scale-105"
                    >
                      {a.name} <span className="text-tan">({t(`addAnimal.${a.sex}`)})</span>
                    </button>
                  ))}
                </div>
              )}

              {editingBirth === b.id && (
                <EditBirthForm
                  birth={b}
                  cycles={openCycles}
                  sires={sires}
                  isSaving={updateMutation.isLoading}
                  onCancel={() => setEditingBirth(null)}
                  onSave={(payload) => updateMutation.mutate({ id: b.id, payload })}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {deletingBirth && (
        <ConfirmModal
          title={t('births.confirmDeleteTitle')}
          body={t('births.confirmDeleteBody')}
          isConfirming={deleteMutation.isLoading}
          onCancel={() => setDeletingBirth(null)}
          onConfirm={() => deleteMutation.mutate(deletingBirth.id)}
        />
      )}
    </div>
  )
}

export default BirthsSection
