import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { animalService } from '../../../services/api/animals.js'
import ConfirmModal from '../../../components/common/UI/ConfirmModal.jsx'
import { HfInput, fmtDate, cardClass, C } from '../../../theme/hf.jsx'
import { apiErrorMessage } from '../../../utils/apiError.js'

const today = () => new Date().toISOString().slice(0, 10)

const saveBtnClass =
  'col-span-2 flex h-[46px] items-center justify-center rounded border-none bg-meadow-700 px-5 text-sm font-medium ' +
  'text-white transition-colors duration-hf enabled:hover:bg-meadow-900 disabled:cursor-not-allowed disabled:opacity-45 xs:col-span-1'

/**
 * Weight history for one animal, extended in Phase 2 with edit/delete —
 * the only Phase 1 record type this app lets the user correct after the
 * fact, now joined by breeding cycles/births/health records which ship
 * with edit/delete from day one.
 */
const WeightHistorySection = ({ animalId }) => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [weightKg, setWeightKg] = useState('')
  const [measuredAt, setMeasuredAt] = useState(today())
  const [weightNotes, setWeightNotes] = useState('')

  const [editingId, setEditingId] = useState(null)
  const [editKg, setEditKg] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [deletingWeight, setDeletingWeight] = useState(null)

  const { data: weights = [] } = useQuery(
    ['weights', animalId],
    () => animalService.getWeights(animalId),
    { enabled: !!animalId }
  )

  const invalidate = () => queryClient.invalidateQueries(['weights', animalId])

  // The list endpoint returns newest-first (correct for the table below);
  // a trend line needs the opposite, oldest-first, so it reads left to right.
  const trendData = weights
    .slice()
    .sort((a, b) => new Date(a.measured_at) - new Date(b.measured_at))
    .map((w) => ({ date: fmtDate(w.measured_at, i18n.language), weight_kg: w.weight_kg }))

  const addWeightMutation = useMutation((payload) => animalService.addWeight(animalId, payload), {
    onSuccess: async () => {
      await invalidate()
      setWeightKg('')
      setWeightNotes('')
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const updateWeightMutation = useMutation(({ id, payload }) => animalService.updateWeight(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setEditingId(null)
      toast.success(t('animalDetails.weights.updated'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const deleteWeightMutation = useMutation((id) => animalService.deleteWeight(id), {
    onSuccess: async () => {
      await invalidate()
      setDeletingWeight(null)
      toast.success(t('animalDetails.weights.deleted'))
    },
    onError: (error) => {
      setDeletingWeight(null)
      toast.error(apiErrorMessage(error, t('common.error')))
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

  const startEdit = (w) => {
    setEditingId(w.id)
    setEditKg(String(w.weight_kg))
    setEditDate(w.measured_at)
    setEditNotes(w.notes || '')
  }

  const submitEdit = () => {
    const parsed = parseFloat(editKg)
    if (Number.isNaN(parsed) || parsed < 0 || !editDate) {
      toast.error(t('animalDetails.weights.weightRequired'))
      return
    }
    updateWeightMutation.mutate({ id: editingId, payload: { weight_kg: parsed, measured_at: editDate, notes: editNotes.trim() || undefined } })
  }

  return (
    <div className={classNames(cardClass, 'p-7')}>
      <h2 className="mb-[18px] text-[22px]">{t('animalDetails.weights.title')}</h2>

      {trendData.length >= 2 && (
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-ink-900">{t('animalDetails.weights.trendTitle')}</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.chartGrid} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} width={40} />
              <Tooltip />
              <Line type="monotone" dataKey="weight_kg" name={t('animalDetails.weights.weightKg')} stroke={C.chart1} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {weights.length === 0 ? (
        <p className="mb-4 text-sm text-ink-500">{t('animalDetails.weights.empty')}</p>
      ) : (
        <div className="mb-5 flex flex-col gap-2">
          {weights.map((w) => (
            <div key={w.id} className="rounded-lg border border-line bg-surface-sunken px-4 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-base font-semibold text-ink-900">{w.weight_kg} kg</span>
                <span className="text-sm text-ink-500">{fmtDate(w.measured_at, i18n.language)}</span>
                {w.notes && <span className="min-w-0 flex-1 truncate text-end text-[12.5px] text-ink-500">{w.notes}</span>}
                <div className="flex flex-none gap-2">
                  <button onClick={() => (editingId === w.id ? setEditingId(null) : startEdit(w))} className="text-[12.5px] font-medium text-meadow-700 underline decoration-dotted underline-offset-2">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => setDeletingWeight(w)} className="text-[12.5px] font-medium text-danger-fg underline decoration-dotted underline-offset-2">
                    {t('common.delete')}
                  </button>
                </div>
              </div>

              {editingId === w.id && (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 xs:grid-cols-[1fr_1fr_2fr_auto] xs:items-end">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.weights.weightKg')}</label>
                    <HfInput type="number" min="0" step="0.1" value={editKg} onChange={(e) => setEditKg(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.weights.date')}</label>
                    <HfInput type="date" value={editDate} max={today()} onChange={(e) => setEditDate(e.target.value)} />
                  </div>
                  <div className="col-span-2 xs:col-span-1">
                    <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.weights.notes')}</label>
                    <HfInput type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder={t('animalDetails.weights.notesPlaceholder')} />
                  </div>
                  <button onClick={submitEdit} disabled={updateWeightMutation.isLoading} className={saveBtnClass}>
                    {updateWeightMutation.isLoading ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 xs:grid-cols-[1fr_1fr_2fr_auto] xs:items-end">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.weights.weightKg')}</label>
          <HfInput type="number" min="0" step="0.1" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.weights.date')}</label>
          <HfInput type="date" value={measuredAt} max={today()} onChange={(e) => setMeasuredAt(e.target.value)} />
        </div>
        <div className="col-span-2 xs:col-span-1">
          <label className="mb-1.5 block text-xs font-medium text-ink-700">{t('animalDetails.weights.notes')}</label>
          <HfInput type="text" value={weightNotes} onChange={(e) => setWeightNotes(e.target.value)} placeholder={t('animalDetails.weights.notesPlaceholder')} />
        </div>
        <button
          onClick={submitWeight}
          disabled={addWeightMutation.isLoading}
          className={saveBtnClass}
        >
          {addWeightMutation.isLoading ? t('animalDetails.weights.saving') : t('animalDetails.weights.save')}
        </button>
      </div>

      {deletingWeight && (
        <ConfirmModal
          title={t('animalDetails.weights.confirmDeleteTitle')}
          body={t('common.deleteWarning')}
          isConfirming={deleteWeightMutation.isLoading}
          onCancel={() => setDeletingWeight(null)}
          onConfirm={() => deleteWeightMutation.mutate(deletingWeight.id)}
        />
      )}
    </div>
  )
}

export default WeightHistorySection
