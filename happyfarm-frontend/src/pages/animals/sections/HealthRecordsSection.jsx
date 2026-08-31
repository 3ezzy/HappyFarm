import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { healthRecordService } from '../../../services/api/healthRecords.js'
import ConfirmModal from '../../../components/common/UI/ConfirmModal.jsx'
import LoadingSpinner from '../../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, HfSelect, fmtDate, cardClass, badge, btnPrimary, btnSecondary } from '../../../theme/hf.jsx'
import { apiErrorMessage } from '../../../utils/apiError.js'

const today = () => new Date().toISOString().slice(0, 10)
const fieldLabel = 'mb-1.5 block text-xs font-medium text-ink-700'
const KINDS = ['vaccine', 'antiparasitic', 'antibiotic', 'vitamin', 'disease', 'surgery', 'injury']

const emptyForm = {
  kind: 'vaccine',
  product: '',
  dose: '',
  administered_on: today(),
  next_due_on: '',
  withdrawal_until: '',
  cost: '',
  veterinarian: '',
  notes: '',
}

const formFromRecord = (r) => ({
  kind: r.kind,
  product: r.product || '',
  dose: r.dose || '',
  administered_on: r.administered_on,
  next_due_on: r.next_due_on || '',
  withdrawal_until: r.withdrawal_until || '',
  cost: r.cost !== null && r.cost !== undefined ? String(r.cost) : '',
  veterinarian: r.veterinarian || '',
  notes: r.notes || '',
})

const toPayload = (form) => ({
  kind: form.kind,
  product: form.product.trim() || undefined,
  dose: form.dose.trim() || undefined,
  administered_on: form.administered_on,
  next_due_on: form.next_due_on || undefined,
  withdrawal_until: form.withdrawal_until || undefined,
  cost: form.cost !== '' ? parseFloat(form.cost) : undefined,
  veterinarian: form.veterinarian.trim() || undefined,
  notes: form.notes.trim() || undefined,
})

const RecordForm = ({ form, setForm, onSave, onCancel, isSaving, submitLabel, savingLabel }) => {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border border-line bg-surface-sunken p-4 xs:grid-cols-3">
      <div>
        <label className={fieldLabel}>{t('healthRecords.kind')}</label>
        <HfSelect value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
          {KINDS.map((k) => (
            <option key={k} value={k}>{t(`healthRecords.kinds.${k}`)}</option>
          ))}
        </HfSelect>
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.product')}</label>
        <HfInput type="text" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} placeholder={t('healthRecords.productPlaceholder')} />
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.dose')}</label>
        <HfInput type="text" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} placeholder={t('healthRecords.dosePlaceholder')} />
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.administeredOn')}</label>
        <HfInput type="date" value={form.administered_on} max={today()} onChange={(e) => setForm({ ...form, administered_on: e.target.value })} />
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.nextDueOn')}</label>
        <HfInput type="date" value={form.next_due_on} min={form.administered_on} onChange={(e) => setForm({ ...form, next_due_on: e.target.value })} />
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.withdrawalUntil')}</label>
        <HfInput type="date" value={form.withdrawal_until} min={form.administered_on} onChange={(e) => setForm({ ...form, withdrawal_until: e.target.value })} />
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.cost')}</label>
        <HfInput type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.veterinarian')}</label>
        <HfInput type="text" value={form.veterinarian} onChange={(e) => setForm({ ...form, veterinarian: e.target.value })} placeholder={t('healthRecords.veterinarianPlaceholder')} />
      </div>
      <div>
        <label className={fieldLabel}>{t('healthRecords.notes')}</label>
        <HfInput type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('healthRecords.notesPlaceholder')} />
      </div>
      <div className="flex gap-2 xs:col-span-3">
        <button onClick={onSave} disabled={isSaving} className={btnPrimary}>
          {isSaving ? savingLabel : submitLabel}
        </button>
        <button onClick={onCancel} className={btnSecondary}>{t('common.cancel')}</button>
      </div>
    </div>
  )
}

/**
 * Vaccinations, antiparasitics, antibiotics, vitamins, disease/surgery/
 * injury notes — one flat list per animal (any animal, not just dams).
 * The active-withdrawal banner on the profile itself reads
 * animal.active_withdrawal (backend-derived); this list just shows the
 * raw records that feed it.
 */
const HealthRecordsSection = ({ animalId }) => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [deletingRecord, setDeletingRecord] = useState(null)

  const { data: records = [], isLoading } = useQuery(
    ['health-records', animalId],
    () => healthRecordService.getAll(animalId)
  )

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries(['health-records', animalId]),
      queryClient.invalidateQueries(['animal', animalId]),
      queryClient.invalidateQueries('animals'),
      queryClient.invalidateQueries('alerts'),
    ])

  const createMutation = useMutation((payload) => healthRecordService.create(animalId, payload), {
    onSuccess: async () => {
      await invalidate()
      setShowAddForm(false)
      setAddForm(emptyForm)
      toast.success(t('healthRecords.created'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const updateMutation = useMutation(({ id, payload }) => healthRecordService.update(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setEditingId(null)
      toast.success(t('healthRecords.updated'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const deleteMutation = useMutation((id) => healthRecordService.remove(id), {
    onSuccess: async () => {
      await invalidate()
      setDeletingRecord(null)
      toast.success(t('healthRecords.deleted'))
    },
    onError: (error) => {
      setDeletingRecord(null)
      toast.error(apiErrorMessage(error, t('common.error')))
    },
  })

  const submitAdd = () => {
    if (!addForm.administered_on) {
      toast.error(t('healthRecords.administeredOnRequired'))
      return
    }
    createMutation.mutate(toPayload(addForm))
  }

  const submitEdit = (id) => {
    if (!editForm.administered_on) {
      toast.error(t('healthRecords.administeredOnRequired'))
      return
    }
    updateMutation.mutate({ id, payload: toPayload(editForm) })
  }

  const isWithdrawalActive = (r) => r.withdrawal_until && r.withdrawal_until >= today()

  return (
    <div className={classNames(cardClass, 'p-7')}>
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px]">{t('healthRecords.title')}</h2>
        {!showAddForm && (
          <button onClick={() => setShowAddForm(true)} className={btnPrimary}>{t('healthRecords.add')}</button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-5">
          <RecordForm
            form={addForm}
            setForm={setAddForm}
            onSave={submitAdd}
            onCancel={() => { setShowAddForm(false); setAddForm(emptyForm) }}
            isSaving={createMutation.isLoading}
            submitLabel={t('healthRecords.submit')}
            savingLabel={t('healthRecords.submitting')}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><LoadingSpinner message={t('common.loading')} /></div>
      ) : records.length === 0 ? (
        <p className="text-sm text-ink-500">{t('healthRecords.empty')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {records.map((r) => (
            <div key={r.id} className="rounded-lg border border-line bg-surface-sunken px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={badge('active')}>{t(`healthRecords.kinds.${r.kind}`)}</span>
                  {r.product && <span className="font-display text-[15px] font-semibold text-ink-900">{r.product}</span>}
                  <span className="text-[13px] text-ink-500">{fmtDate(r.administered_on, i18n.language)}</span>
                  {isWithdrawalActive(r) && (
                    <span className={badge('eligible')}>{t('healthRecords.withdrawalActiveTag')}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setEditingId(editingId === r.id ? null : r.id); setEditForm(formFromRecord(r)) }}
                    className="text-[12.5px] font-medium text-meadow-700 underline decoration-dotted underline-offset-2"
                  >
                    {t('common.edit')}
                  </button>
                  <button onClick={() => setDeletingRecord(r)} className="text-[12.5px] font-medium text-danger-fg underline decoration-dotted underline-offset-2">
                    {t('common.delete')}
                  </button>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[12.5px] text-ink-500">
                {r.dose && <span>{t('healthRecords.dose')}: {r.dose}</span>}
                {r.next_due_on && <span>{t('healthRecords.nextDueOn')}: {fmtDate(r.next_due_on, i18n.language)}</span>}
                {r.withdrawal_until && <span>{t('healthRecords.withdrawalUntil')}: {fmtDate(r.withdrawal_until, i18n.language)}</span>}
                {r.cost !== null && r.cost !== undefined && <span>{t('healthRecords.cost')}: {r.cost}</span>}
                {r.veterinarian && <span>{t('healthRecords.veterinarian')}: {r.veterinarian}</span>}
              </div>
              {r.notes && <p className="mt-1 text-[12.5px] text-ink-500">{r.notes}</p>}

              {editingId === r.id && (
                <div className="mt-3">
                  <RecordForm
                    form={editForm}
                    setForm={setEditForm}
                    onSave={() => submitEdit(r.id)}
                    onCancel={() => setEditingId(null)}
                    isSaving={updateMutation.isLoading}
                    submitLabel={t('common.save')}
                    savingLabel={t('common.saving')}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {deletingRecord && (
        <ConfirmModal
          title={t('healthRecords.confirmDeleteTitle')}
          body={t('common.deleteWarning')}
          isConfirming={deleteMutation.isLoading}
          onCancel={() => setDeletingRecord(null)}
          onConfirm={() => deleteMutation.mutate(deletingRecord.id)}
        />
      )}
    </div>
  )
}

export default HealthRecordsSection
