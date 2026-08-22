import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { birthService } from '../../../services/api/births.js'
import { breedingCycleService } from '../../../services/api/breedingCycles.js'
import { animalService } from '../../../services/api/animals.js'
import { HfInput, HfSelect } from '../../../theme/hf.jsx'
import { apiErrorMessage } from '../../../utils/apiError.js'

const today = () => new Date().toISOString().slice(0, 10)

const fieldLabel = 'mb-1.5 block text-xs font-semibold text-brown-text'
const fieldGroup = 'mb-4'

const primaryBtnClass =
  'flex-1 cursor-pointer rounded-full border-none bg-brown p-3 font-display text-[15px] font-bold text-white ' +
  'shadow-soft transition-all duration-200 ease-pop enabled:hover:scale-[1.02] enabled:hover:bg-brown-dark ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

const ghostBtnClass =
  'flex-1 cursor-pointer rounded-full border-2 border-line bg-cream p-3 font-display text-[15px] font-bold ' +
  'text-brown-text transition-transform duration-150 hover:scale-[1.03]'

const makeOffspringRow = (t, damType, index) => ({
  key: `${Date.now()}-${index}-${Math.random()}`,
  name: t('births.offspringDefaultName', { context: damType, n: index + 1 }),
  sex: '',
  tag: '',
  birthWeightKg: '',
})

/**
 * Records a birth for `dam`. Creates real animal records for each live
 * offspring on the backend (never for the stillborn difference between
 * total and alive) — this form only collects what BirthController::store
 * needs, it doesn't duplicate any of that logic itself.
 */
const BirthModal = ({ dam, initialCycleId, onClose }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: cycles = [] } = useQuery(['breeding-cycles', dam.id], () => breedingCycleService.getAll(dam.id))
  const { data: animals = [] } = useQuery('animals', () => animalService.getAll())
  // Same species as the dam, old enough, not archived, hasn't exited.
  const sires = animals.filter((a) =>
    a.type === dam.type &&
    a.sex === 'male' &&
    a.age != null &&
    a.min_age != null &&
    a.age >= a.min_age &&
    !a.is_archived &&
    !a.exit_reason
  )
  const openCycles = cycles.filter((c) => !c.birth_id)

  const [cycleId, setCycleId] = useState(initialCycleId ? String(initialCycleId) : '')
  const [sireId, setSireId] = useState('')
  const [bornOn, setBornOn] = useState(today())
  const [offspringTotal, setOffspringTotal] = useState('1')
  const [offspringAlive, setOffspringAlive] = useState('1')
  const [difficulty, setDifficulty] = useState('')
  const [notes, setNotes] = useState('')
  const [offspring, setOffspring] = useState([makeOffspringRow(t, dam.type, 0)])

  // Preselecting a tracked cycle carries its sire over as a starting point
  // — the user can still change it, this just saves a redundant pick.
  useEffect(() => {
    if (cycleId) {
      const cycle = cycles.find((c) => String(c.id) === cycleId)
      if (cycle?.sire_id && !sireId) {
        setSireId(String(cycle.sire_id))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleId])

  const resizeOffspring = (count) => {
    setOffspring((prev) => {
      const next = prev.slice(0, count)
      for (let i = next.length; i < count; i++) {
        next.push(makeOffspringRow(t, dam.type, i))
      }
      return next
    })
  }

  const handleAliveChange = (value) => {
    setOffspringAlive(value)
    const n = parseInt(value, 10)
    resizeOffspring(Number.isNaN(n) || n < 0 ? 0 : n)
  }

  const updateRow = (key, field, value) => {
    setOffspring((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)))
  }

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries(['births', dam.id]),
      queryClient.invalidateQueries(['breeding-cycles', dam.id]),
      queryClient.invalidateQueries(['animal', dam.id]),
      queryClient.invalidateQueries('animals'),
      queryClient.invalidateQueries('farm-statistics'),
      queryClient.invalidateQueries('alerts'),
    ])

  const createMutation = useMutation((payload) => birthService.create(dam.id, payload), {
    onSuccess: async () => {
      await invalidate()
      toast.success(t('births.created'))
      onClose()
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const submit = () => {
    const total = parseInt(offspringTotal, 10)
    const alive = parseInt(offspringAlive, 10)

    if (!bornOn) {
      toast.error(t('births.bornOnRequired'))
      return
    }
    if (Number.isNaN(total) || total < 0 || Number.isNaN(alive) || alive < 0 || alive > total) {
      toast.error(t('births.offspringCountMismatch', { count: alive || 0 }))
      return
    }
    if (offspring.length !== alive) {
      toast.error(t('births.offspringCountMismatch', { count: alive }))
      return
    }
    if (offspring.some((row) => !row.name.trim() || !row.sex)) {
      toast.error(t('births.offspringDetailsRequired'))
      return
    }

    createMutation.mutate({
      breeding_cycle_id: cycleId || undefined,
      sire_id: sireId || undefined,
      born_on: bornOn,
      offspring_total: total,
      offspring_alive: alive,
      difficulty: difficulty || undefined,
      notes: notes.trim() || undefined,
      offspring: offspring.map((row) => ({
        name: row.name.trim(),
        sex: row.sex,
        tag: row.tag.trim() || undefined,
        birth_weight_kg: row.birthWeightKg ? parseFloat(row.birthWeightKg) : undefined,
      })),
    })
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex animate-hf-fade items-start justify-center overflow-y-auto bg-scrim p-5 backdrop-blur-[3px] sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="my-8 w-full max-w-[620px] animate-hf-modal overflow-hidden rounded-2xl bg-cream shadow-card"
      >
        <div className="max-h-[80vh] overflow-y-auto p-7">
          <h3 className="mb-5 text-2xl">{t('breeding.recordBirth')}</h3>

          <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2">
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t('births.cycle')}</label>
              <HfSelect value={cycleId} onChange={(e) => setCycleId(e.target.value)}>
                <option value="">{t('births.cycleNone')}</option>
                {openCycles.map((c) => (
                  <option key={c.id} value={c.id}>{c.bred_on}{c.sire_name ? ` — ${c.sire_name}` : ''}</option>
                ))}
              </HfSelect>
            </div>
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t('births.sire')}</label>
              <HfSelect value={sireId} onChange={(e) => setSireId(e.target.value)}>
                <option value="">{t('births.sireOptional')}</option>
                {sires.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </HfSelect>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-3">
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t('births.bornOn')}</label>
              <HfInput type="date" value={bornOn} max={today()} onChange={(e) => setBornOn(e.target.value)} />
            </div>
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t('births.offspringTotal')}</label>
              <HfInput type="number" min="0" step="1" value={offspringTotal} onChange={(e) => setOffspringTotal(e.target.value)} />
            </div>
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t('births.offspringAlive')}</label>
              <HfInput type="number" min="0" step="1" value={offspringAlive} onChange={(e) => handleAliveChange(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2">
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t('births.difficulty.label')}</label>
              <HfSelect value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">{t('births.difficulty.select')}</option>
                <option value="easy">{t('births.difficulty.easy')}</option>
                <option value="assisted">{t('births.difficulty.assisted')}</option>
                <option value="difficult">{t('births.difficulty.difficult')}</option>
                <option value="cesarean">{t('births.difficulty.cesarean')}</option>
              </HfSelect>
            </div>
            <div className={fieldGroup}>
              <label className={fieldLabel}>{t('births.notes')}</label>
              <HfInput type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('births.notesPlaceholder')} />
            </div>
          </div>

          {offspring.length > 0 && (
            <div className="mb-2 mt-2 border-t border-line pt-4">
              <h4 className="mb-1 text-base font-bold text-brown-text">{t('births.offspring')}</h4>
              <p className="mb-3 text-[12.5px] text-tan">{t('births.offspringHint')}</p>
              <div className="flex flex-col gap-3">
                {offspring.map((row) => (
                  <div key={row.key} className="grid grid-cols-2 gap-2.5 rounded-xl bg-sand p-3.5 xs:grid-cols-4">
                    <div>
                      <label className={fieldLabel}>{t('births.offspringName')}</label>
                      <HfInput type="text" value={row.name} onChange={(e) => updateRow(row.key, 'name', e.target.value)} />
                    </div>
                    <div>
                      <label className={fieldLabel}>{t('births.offspringSex')}</label>
                      <HfSelect value={row.sex} onChange={(e) => updateRow(row.key, 'sex', e.target.value)}>
                        <option value="">{t('addAnimal.selectOptional')}</option>
                        <option value="female">{t('addAnimal.female')}</option>
                        <option value="male">{t('addAnimal.male')}</option>
                      </HfSelect>
                    </div>
                    <div>
                      <label className={fieldLabel}>{t('births.offspringTag')}</label>
                      <HfInput type="text" value={row.tag} onChange={(e) => updateRow(row.key, 'tag', e.target.value)} placeholder={t('births.offspringTagPlaceholder')} />
                    </div>
                    <div>
                      <label className={fieldLabel}>{t('births.offspringBirthWeight')}</label>
                      <HfInput
                        type="number" min="0" step="0.1"
                        value={row.birthWeightKg}
                        onChange={(e) => updateRow(row.key, 'birthWeightKg', e.target.value)}
                        placeholder={t('births.offspringBirthWeightPlaceholder')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button onClick={onClose} className={ghostBtnClass}>{t('common.cancel')}</button>
            <button onClick={submit} disabled={createMutation.isLoading} className={primaryBtnClass}>
              {createMutation.isLoading ? t('births.submitting') : t('births.submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BirthModal
