import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { breedingCycleService } from '../../../services/api/breedingCycles.js'
import { animalService } from '../../../services/api/animals.js'
import ConfirmModal from '../../../components/common/UI/ConfirmModal.jsx'
import LoadingSpinner from '../../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, HfSelect, fmtDate, cardClass, badge } from '../../../theme/hf.jsx'
import { apiErrorMessage } from '../../../utils/apiError.js'

const today = () => new Date().toISOString().slice(0, 10)

const actionBtnClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-full border-none bg-green px-5 py-2.5 ' +
  'font-display text-sm font-bold text-white shadow-chip transition-transform duration-200 ease-pop ' +
  'enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-70'

const ghostBtnClass =
  'cursor-pointer rounded-full border-2 border-line bg-cream px-4 py-2 font-display text-[13.5px] font-bold ' +
  'text-brown-text transition-transform duration-200 ease-pop hover:scale-[1.03]'

const fieldLabel = 'mb-1.5 block text-xs font-semibold text-brown-text'

const cycleStatusTone = {
  bred: 'active',
  pregnant: 'eligible',
  not_pregnant: 'sacrificed',
  aborted: 'sacrificed',
  lambed: 'active',
}

/**
 * Breeding cycle tracking for a dam: current open cycle (with the action
 * relevant to its stage — pregnancy check, record birth, or record
 * weaning) plus a history list with edit/delete. Only rendered for female
 * animals; breeding_status itself always comes from the backend.
 */
const BreedingSection = ({ animal, onRecordBirth }) => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [showStartForm, setShowStartForm] = useState(false)
  const [showCheckForm, setShowCheckForm] = useState(null) // cycle id or null
  const [showWeanForm, setShowWeanForm] = useState(null) // cycle id or null
  const [editingCycle, setEditingCycle] = useState(null) // cycle id or null
  const [deletingCycle, setDeletingCycle] = useState(null) // cycle object or null

  const [sireId, setSireId] = useState('')
  const [method, setMethod] = useState('natural')
  const [bredOn, setBredOn] = useState(today())
  const [notes, setNotes] = useState('')

  const [checkResult, setCheckResult] = useState('pregnant')
  const [checkedOn, setCheckedOn] = useState(today())
  const [weanedOn, setWeanedOn] = useState(today())

  const { data: cycles = [], isLoading } = useQuery(
    ['breeding-cycles', animal.id],
    () => breedingCycleService.getAll(animal.id)
  )
  const { data: animals = [] } = useQuery('animals', () => animalService.getAll())
  // Same species as this dam, old enough, not archived, hasn't exited.
  const sires = animals.filter((a) =>
    a.type === animal.type &&
    a.sex === 'male' &&
    a.age != null &&
    a.min_age != null &&
    a.age >= a.min_age &&
    !a.is_archived &&
    !a.exit_reason
  )

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries(['breeding-cycles', animal.id]),
      queryClient.invalidateQueries(['animal', animal.id]),
      queryClient.invalidateQueries('animals'),
      queryClient.invalidateQueries('farm-statistics'),
      queryClient.invalidateQueries('alerts'),
    ])

  const resetStartForm = () => {
    setSireId('')
    setMethod('natural')
    setBredOn(today())
    setNotes('')
  }

  const startMutation = useMutation((payload) => breedingCycleService.create(animal.id, payload), {
    onSuccess: async () => {
      await invalidate()
      setShowStartForm(false)
      resetStartForm()
      toast.success(t('breeding.cycleStarted'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const updateMutation = useMutation(({ id, payload }) => breedingCycleService.update(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setEditingCycle(null)
      toast.success(t('breeding.updated'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const deleteMutation = useMutation((id) => breedingCycleService.remove(id), {
    onSuccess: async () => {
      await invalidate()
      setDeletingCycle(null)
      toast.success(t('breeding.deleted'))
    },
    onError: (error) => {
      setDeletingCycle(null)
      toast.error(apiErrorMessage(error, t('common.error')))
    },
  })

  const checkMutation = useMutation(({ id, payload }) => breedingCycleService.pregnancyCheck(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setShowCheckForm(null)
      toast.success(t('breeding.pregnancyCheck.recorded'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const weanMutation = useMutation(({ id, payload }) => breedingCycleService.wean(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setShowWeanForm(null)
      toast.success(t('breeding.wean.recorded'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const submitStart = () => {
    startMutation.mutate({
      sire_id: sireId || undefined,
      method,
      bred_on: bredOn,
      notes: notes.trim() || undefined,
    })
  }

  const submitCheck = (cycleId) => {
    checkMutation.mutate({ id: cycleId, payload: { result: checkResult, checked_on: checkedOn } })
  }

  const submitWean = (cycleId) => {
    weanMutation.mutate({ id: cycleId, payload: { weaned_on: weanedOn } })
  }

  // Keyed off c.status (backend-derived from birthed_on, not birth_id) so
  // this stays correct even after a cycle's birth log entry is deleted —
  // birth_id goes null then, but status correctly stays 'lambed'.
  const openCycle = cycles.find((c) => c.status !== 'lambed' && (c.pregnancy_result === 'pending' || c.pregnancy_result === 'pregnant'))
  const nursingCycle = cycles.find((c) => c.status === 'lambed' && !c.weaned_on)
  const birthTerm = t('breeding.birthEventTerm', { context: animal.type })

  /**
   * Per-row history label. Unlike the single current-cycle card above, a
   * closed cycle's pregnancy_result (not_pregnant/aborted) is worth
   * showing distinctly rather than collapsing both into "available" —
   * that distinction is only meaningful for cycles that are done.
   */
  const cycleBadgeLabel = (c) => {
    if (c.status === 'lambed') {
      return t(`breeding.status.${c.weaned_on ? 'available' : 'nursing'}`)
    }
    if (c.pregnancy_result === 'pending') {
      return t('breeding.status.bred')
    }
    return t(`breeding.pregnancyResult.${c.pregnancy_result}`)
  }

  const EditCycleForm = ({ cycle }) => {
    const [eSireId, setESireId] = useState(cycle.sire_id || '')
    const [eMethod, setEMethod] = useState(cycle.method)
    const [eBredOn, setEBredOn] = useState(cycle.bred_on)
    const [eNotes, setENotes] = useState(cycle.notes || '')

    return (
      <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-sand p-4 xs:grid-cols-2">
        <div>
          <label className={fieldLabel}>{t('breeding.sire')}</label>
          <HfSelect value={eSireId} onChange={(e) => setESireId(e.target.value)}>
            <option value="">{t('breeding.sireOptional')}</option>
            {sires.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </HfSelect>
        </div>
        <div>
          <label className={fieldLabel}>{t('breeding.methodLabel')}</label>
          <HfSelect value={eMethod} onChange={(e) => setEMethod(e.target.value)}>
            <option value="natural">{t('breeding.method.natural')}</option>
            <option value="ai">{t('breeding.method.ai')}</option>
          </HfSelect>
        </div>
        <div>
          <label className={fieldLabel}>{t('breeding.bredOn')}</label>
          <HfInput type="date" value={eBredOn} max={today()} onChange={(e) => setEBredOn(e.target.value)} />
        </div>
        <div>
          <label className={fieldLabel}>{t('breeding.notes')}</label>
          <HfInput type="text" value={eNotes} onChange={(e) => setENotes(e.target.value)} placeholder={t('breeding.notesPlaceholder')} />
        </div>
        <div className="flex gap-2 xs:col-span-2">
          <button
            onClick={() => updateMutation.mutate({ id: cycle.id, payload: { sire_id: eSireId || undefined, method: eMethod, bred_on: eBredOn, notes: eNotes.trim() || undefined } })}
            disabled={updateMutation.isLoading}
            className={actionBtnClass}
          >
            {updateMutation.isLoading ? t('common.saving') : t('common.save')}
          </button>
          <button onClick={() => setEditingCycle(null)} className={ghostBtnClass}>{t('common.cancel')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className={classNames(cardClass, 'p-7')}>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px]">{t('breeding.title')}</h2>
        {!openCycle && !nursingCycle && !showStartForm && (
          <button onClick={() => setShowStartForm(true)} className={actionBtnClass}>
            {t('breeding.startCycle')}
          </button>
        )}
      </div>

      {showStartForm && (
        <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl bg-green-soft2 p-4 xs:grid-cols-2">
          <div>
            <label className={fieldLabel}>{t('breeding.sire')}</label>
            <HfSelect value={sireId} onChange={(e) => setSireId(e.target.value)}>
              <option value="">{t('breeding.sireOptional')}</option>
              {sires.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </HfSelect>
          </div>
          <div>
            <label className={fieldLabel}>{t('breeding.methodLabel')}</label>
            <HfSelect value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="natural">{t('breeding.method.natural')}</option>
              <option value="ai">{t('breeding.method.ai')}</option>
            </HfSelect>
          </div>
          <div>
            <label className={fieldLabel}>{t('breeding.bredOn')}</label>
            <HfInput type="date" value={bredOn} max={today()} onChange={(e) => setBredOn(e.target.value)} />
          </div>
          <div>
            <label className={fieldLabel}>{t('breeding.notes')}</label>
            <HfInput type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('breeding.notesPlaceholder')} />
          </div>
          <div className="flex gap-2 xs:col-span-2">
            <button onClick={submitStart} disabled={startMutation.isLoading} className={actionBtnClass}>
              {startMutation.isLoading ? t('breeding.starting') : t('breeding.startCycle')}
            </button>
            <button onClick={() => { setShowStartForm(false); resetStartForm() }} className={ghostBtnClass}>{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {/* Current cycle card */}
      {openCycle && (
        <div className="mb-5 rounded-2xl border-[3px] border-green-border bg-green-soft p-[18px]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[15px] text-brown-text">{t('breeding.openCycleTitle')}</h4>
            <span className={badge(cycleStatusTone[openCycle.status] || 'active')}>
              {t(`breeding.status.${animal.breeding_status}`)}
            </span>
          </div>
          <p className="text-sm text-brown">{t('breeding.bredOn')}: {fmtDate(openCycle.bred_on, i18n.language)}</p>
          {openCycle.sire_name && <p className="mt-0.5 text-sm text-brown">{t('breeding.sire')}: {openCycle.sire_name}</p>}

          {openCycle.pregnancy_result === 'pending' && (
            <>
              <p className="mt-1.5 text-[13.5px] text-tan">{t('breeding.expectedCheckOn')}: {fmtDate(openCycle.expected_check_on, i18n.language)}</p>
              {showCheckForm === openCycle.id ? (
                <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-cream p-4 xs:grid-cols-2">
                  <div>
                    <label className={fieldLabel}>{t('breeding.pregnancyCheck.result')}</label>
                    <HfSelect value={checkResult} onChange={(e) => setCheckResult(e.target.value)}>
                      <option value="pregnant">{t('breeding.pregnancyResult.pregnant')}</option>
                      <option value="not_pregnant">{t('breeding.pregnancyResult.not_pregnant')}</option>
                      <option value="aborted">{t('breeding.pregnancyResult.aborted')}</option>
                    </HfSelect>
                  </div>
                  <div>
                    <label className={fieldLabel}>{t('breeding.pregnancyCheck.checkedOn')}</label>
                    <HfInput type="date" value={checkedOn} min={openCycle.bred_on} max={today()} onChange={(e) => setCheckedOn(e.target.value)} />
                  </div>
                  <div className="flex gap-2 xs:col-span-2">
                    <button onClick={() => submitCheck(openCycle.id)} disabled={checkMutation.isLoading} className={actionBtnClass}>
                      {checkMutation.isLoading ? t('breeding.pregnancyCheck.saving') : t('breeding.pregnancyCheck.submit')}
                    </button>
                    <button onClick={() => setShowCheckForm(null)} className={ghostBtnClass}>{t('common.cancel')}</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCheckForm(openCycle.id)} className={classNames(actionBtnClass, 'mt-3')}>
                  {t('breeding.pregnancyCheck.title')}
                </button>
              )}
            </>
          )}

          {openCycle.pregnancy_result === 'pregnant' && (
            <>
              <p className="mt-1.5 text-[13.5px] text-tan">
                {t('breeding.expectedBirthOn', { term: birthTerm })}: {fmtDate(openCycle.expected_lambing_on, i18n.language)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => onRecordBirth(openCycle)} className={actionBtnClass}>
                  {t('breeding.recordBirth')}
                </button>
                {showCheckForm === openCycle.id ? (
                  <div className="mt-3 grid w-full grid-cols-1 gap-3 rounded-xl bg-cream p-4 xs:grid-cols-2">
                    <div>
                      <label className={fieldLabel}>{t('breeding.pregnancyCheck.result')}</label>
                      <HfSelect value={checkResult} onChange={(e) => setCheckResult(e.target.value)}>
                        <option value="pregnant">{t('breeding.pregnancyResult.pregnant')}</option>
                        <option value="not_pregnant">{t('breeding.pregnancyResult.not_pregnant')}</option>
                        <option value="aborted">{t('breeding.pregnancyResult.aborted')}</option>
                      </HfSelect>
                    </div>
                    <div>
                      <label className={fieldLabel}>{t('breeding.pregnancyCheck.checkedOn')}</label>
                      <HfInput type="date" value={checkedOn} min={openCycle.bred_on} max={today()} onChange={(e) => setCheckedOn(e.target.value)} />
                    </div>
                    <div className="flex gap-2 xs:col-span-2">
                      <button onClick={() => submitCheck(openCycle.id)} disabled={checkMutation.isLoading} className={actionBtnClass}>
                        {checkMutation.isLoading ? t('breeding.pregnancyCheck.saving') : t('breeding.pregnancyCheck.submit')}
                      </button>
                      <button onClick={() => setShowCheckForm(null)} className={ghostBtnClass}>{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowCheckForm(openCycle.id)} className={ghostBtnClass}>
                    {t('common.edit')} {t('breeding.pregnancyCheck.title').toLowerCase()}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {nursingCycle && (
        <div className="mb-5 rounded-2xl border-[3px] border-blue bg-blue-soft p-[18px]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[15px] text-blue-dark">{t('breeding.status.nursing')}</h4>
          </div>
          <p className="text-sm text-blue-dark">{t('breeding.expectedWeaningOn')}: {fmtDate(nursingCycle.expected_weaning_on, i18n.language)}</p>
          {showWeanForm === nursingCycle.id ? (
            <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-cream p-4 xs:grid-cols-2">
              <div>
                <label className={fieldLabel}>{t('breeding.wean.weanedOn')}</label>
                <HfInput type="date" value={weanedOn} min={nursingCycle.bred_on} max={today()} onChange={(e) => setWeanedOn(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={() => submitWean(nursingCycle.id)} disabled={weanMutation.isLoading} className={actionBtnClass}>
                  {weanMutation.isLoading ? t('breeding.wean.saving') : t('breeding.wean.submit')}
                </button>
                <button onClick={() => setShowWeanForm(null)} className={ghostBtnClass}>{t('common.cancel')}</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowWeanForm(nursingCycle.id)} className={classNames(actionBtnClass, 'mt-3')}>
              {t('breeding.wean.title')}
            </button>
          )}
        </div>
      )}

      {/* History */}
      <h3 className="mb-2.5 text-base font-bold text-brown-text">{t('breeding.history')}</h3>
      {isLoading ? (
        <div className="flex justify-center py-6"><LoadingSpinner message={t('common.loading')} /></div>
      ) : cycles.length === 0 ? (
        <p className="text-sm text-tan">{t('breeding.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cycles.map((c) => (
            <div key={c.id} className="rounded-xl bg-sand px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={badge(cycleStatusTone[c.status] || 'active')}>{cycleBadgeLabel(c)}</span>
                  <span className="text-sm font-semibold text-brown-text">{fmtDate(c.bred_on, i18n.language)}</span>
                  {c.sire_name && <span className="text-[12.5px] text-tan">· {t('breeding.sire')}: {c.sire_name}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingCycle(editingCycle === c.id ? null : c.id)} className="text-[12.5px] font-semibold text-green underline decoration-dotted underline-offset-2">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => setDeletingCycle(c)} className="text-[12.5px] font-semibold text-red underline decoration-dotted underline-offset-2">
                    {t('common.delete')}
                  </button>
                </div>
              </div>
              {c.notes && <p className="mt-1 text-[12.5px] text-tan">{c.notes}</p>}
              {editingCycle === c.id && <EditCycleForm cycle={c} />}
            </div>
          ))}
        </div>
      )}

      {deletingCycle && (
        <ConfirmModal
          title={t('breeding.confirmDeleteTitle')}
          body={t('breeding.confirmDeleteBody')}
          isConfirming={deleteMutation.isLoading}
          onCancel={() => setDeletingCycle(null)}
          onConfirm={() => deleteMutation.mutate(deletingCycle.id)}
        />
      )}
    </div>
  )
}

export default BreedingSection
