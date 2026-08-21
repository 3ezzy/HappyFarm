import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { inventoryService } from '../../services/api/inventory.js'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import ConfirmModal from '../../components/common/UI/ConfirmModal.jsx'
import { HfInput, fmtDate, cardClass } from '../../theme/hf.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const today = () => new Date().toISOString().slice(0, 10)

const labelClass = 'mb-1.5 block text-xs font-semibold text-brown-text'

const saveBtnClass =
  'cursor-pointer rounded-2xl border-none bg-green px-5 py-2.5 font-display text-sm font-bold text-white ' +
  'shadow-chip transition-transform duration-200 ease-pop enabled:hover:scale-[1.03] ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

const typeToggleClass = (active, tone) =>
  classNames(
    'flex-1 cursor-pointer rounded-full border-2 px-3 py-2 text-center font-sans text-[13.5px] font-semibold transition-all duration-200',
    active
      ? tone === 'restock'
        ? 'border-green bg-green text-white'
        : 'border-red bg-red text-white'
      : 'border-line bg-cream text-brown'
  )

const lowStockBadgeClass =
  'inline-flex items-center rounded-full border-2 border-red-line bg-red-soft px-2.5 py-0.5 text-xs font-semibold text-red-dark'

/**
 * One item's expanded transaction history + restock/consume forms.
 * Transactions are append-only (see InventoryTransactionRequest on the
 * backend) — there is no edit/delete here, only a running log and a form
 * to add to it.
 */
const ItemTransactions = ({ item }) => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()

  const [type, setType] = useState('restock')
  const [quantity, setQuantity] = useState('')
  const [transactionDate, setTransactionDate] = useState(today())
  const [notes, setNotes] = useState('')

  const { data: transactions = [], isLoading } = useQuery(
    ['inventory-transactions', item.id],
    () => inventoryService.getTransactions(item.id)
  )

  const addMutation = useMutation(
    (payload) => inventoryService.addTransaction(item.id, payload),
    {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(['inventory-transactions', item.id]),
          queryClient.invalidateQueries('inventory-items'),
          queryClient.invalidateQueries('alerts'),
        ])
        setQuantity('')
        setNotes('')
        toast.success(t(`inventory.${type}Toast`))
      },
      onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
    }
  )

  const submit = () => {
    const parsed = parseFloat(quantity)
    if (Number.isNaN(parsed) || parsed <= 0 || !transactionDate) {
      toast.error(t('inventory.quantityRequired'))
      return
    }
    addMutation.mutate({ type, quantity: parsed, transactionDate, notes: notes.trim() || undefined })
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      {isLoading ? (
        <div className="flex justify-center py-4"><LoadingSpinner message={t('common.loading')} /></div>
      ) : transactions.length === 0 ? (
        <p className="mb-3 text-sm text-tan">{t('inventory.noTransactions')}</p>
      ) : (
        <div className="mb-4 flex flex-col gap-1.5">
          {transactions.map((tr) => (
            <div key={tr.id} className="flex items-center justify-between gap-3 rounded-xl bg-green-soft2 px-3.5 py-2 text-sm">
              <span className={classNames('font-display font-bold', tr.type === 'restock' ? 'text-green' : 'text-red')}>
                {tr.type === 'restock' ? '+' : '−'}{tr.quantity} {item.unit}
              </span>
              <span className="text-tan">{fmtDate(tr.transaction_date, i18n.language)}</span>
              {tr.notes && <span className="min-w-0 flex-1 truncate text-end text-[12.5px] text-tan">{tr.notes}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => setType('restock')} className={typeToggleClass(type === 'restock', 'restock')}>
          {t('inventory.restock')}
        </button>
        <button onClick={() => setType('consume')} className={typeToggleClass(type === 'consume', 'consume')}>
          {t('inventory.consume')}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 xs:grid-cols-[1fr_1fr_2fr_auto] xs:items-end">
        <div>
          <label className={labelClass}>{t('inventory.quantity')}</label>
          <HfInput type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>{t('inventory.date')}</label>
          <HfInput type="date" value={transactionDate} max={today()} onChange={(e) => setTransactionDate(e.target.value)} />
        </div>
        <div className="col-span-2 xs:col-span-1">
          <label className={labelClass}>{t('inventory.notes')}</label>
          <HfInput type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('common.optional')} />
        </div>
        <button onClick={submit} disabled={addMutation.isLoading} className={classNames(saveBtnClass, 'col-span-2 xs:col-span-1')}>
          {addMutation.isLoading ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  )
}

const Inventory = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery('inventory-items', inventoryService.getAll, {
    refetchOnWindowFocus: true,
  })

  const [expandedId, setExpandedId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editThreshold, setEditThreshold] = useState('')
  const [deletingItem, setDeletingItem] = useState(null)

  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newThreshold, setNewThreshold] = useState('')

  const invalidate = () => queryClient.invalidateQueries('inventory-items')

  const createMutation = useMutation((payload) => inventoryService.create(payload), {
    onSuccess: async () => {
      await invalidate()
      setNewName('')
      setNewUnit('')
      setNewThreshold('')
      toast.success(t('inventory.addedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const updateMutation = useMutation(({ id, payload }) => inventoryService.update(id, payload), {
    onSuccess: async () => {
      await invalidate()
      setEditingId(null)
      toast.success(t('inventory.updatedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const deleteMutation = useMutation((id) => inventoryService.remove(id), {
    onSuccess: async () => {
      await invalidate()
      setDeletingItem(null)
      toast.success(t('inventory.deletedToast'))
    },
    onError: (error) => {
      setDeletingItem(null)
      toast.error(apiErrorMessage(error, t('common.error')))
    },
  })

  const submitNew = () => {
    const trimmedName = newName.trim()
    const trimmedUnit = newUnit.trim()
    if (!trimmedName || !trimmedUnit) {
      toast.error(t('inventory.nameAndUnitRequired'))
      return
    }
    createMutation.mutate({ name: trimmedName, unit: trimmedUnit, lowStockThreshold: newThreshold === '' ? undefined : parseFloat(newThreshold) })
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditUnit(item.unit)
    setEditThreshold(item.low_stock_threshold === null ? '' : String(item.low_stock_threshold))
  }

  const submitEdit = () => {
    const trimmedName = editName.trim()
    const trimmedUnit = editUnit.trim()
    if (!trimmedName || !trimmedUnit) {
      toast.error(t('inventory.nameAndUnitRequired'))
      return
    }
    updateMutation.mutate({
      id: editingId,
      payload: { name: trimmedName, unit: trimmedUnit, lowStockThreshold: editThreshold === '' ? undefined : parseFloat(editThreshold) },
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message={t('common.loading')} />
      </div>
    )
  }

  return (
    <div className="animate-hf-pop">
      <h1 className="mb-1 text-[34px]">{t('inventory.title')}</h1>
      <p className="mb-[22px] text-tan">{t('inventory.subtitle')}</p>

      <div className={classNames(cardClass, 'p-6')}>
        {items.length === 0 ? (
          <p className="mb-4 text-sm text-tan">{t('inventory.empty')}</p>
        ) : (
          <div className="mb-5 flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.id} className="rounded-xl bg-cream px-4 py-3 shadow-chip">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-base font-bold text-brown-text">{item.name}</span>
                    {item.is_low_stock && <span className={lowStockBadgeClass}>{t('inventory.lowStock')}</span>}
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <span className="font-display text-sm font-bold text-brown-text">
                      {item.current_stock} {item.unit}
                    </span>
                    <button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="text-[12.5px] font-semibold text-blue underline decoration-dotted underline-offset-2"
                    >
                      {expandedId === item.id ? t('inventory.hideHistory') : t('inventory.viewHistory')}
                    </button>
                    <button
                      onClick={() => (editingId === item.id ? setEditingId(null) : startEdit(item))}
                      className="text-[12.5px] font-semibold text-green underline decoration-dotted underline-offset-2"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => !item.has_transactions && setDeletingItem(item)}
                      disabled={item.has_transactions}
                      title={item.has_transactions ? t('inventory.deleteDisabledHint') : undefined}
                      className={classNames(
                        'text-[12.5px] font-semibold underline decoration-dotted underline-offset-2',
                        item.has_transactions ? 'cursor-not-allowed text-tan' : 'cursor-pointer text-red'
                      )}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>

                {item.low_stock_threshold !== null && (
                  <p className="mt-1 text-[12px] text-tan">
                    {t('inventory.thresholdLabel', { threshold: item.low_stock_threshold, unit: item.unit })}
                  </p>
                )}

                {editingId === item.id && (
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 xs:grid-cols-[2fr_1fr_1fr_auto] xs:items-end">
                    <div>
                      <label className={labelClass}>{t('inventory.name')}</label>
                      <HfInput type="text" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('inventory.unit')}</label>
                      <HfInput type="text" value={editUnit} onChange={(e) => setEditUnit(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelClass}>{t('inventory.lowStockThreshold')}</label>
                      <HfInput type="number" min="0" step="0.01" value={editThreshold} onChange={(e) => setEditThreshold(e.target.value)} placeholder={t('common.optional')} />
                    </div>
                    <button onClick={submitEdit} disabled={updateMutation.isLoading} className={classNames(saveBtnClass, 'col-span-2 xs:col-span-1')}>
                      {updateMutation.isLoading ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                )}

                {expandedId === item.id && <ItemTransactions item={item} />}
              </div>
            ))}
          </div>
        )}

        <p className="mb-3 mt-2 text-sm font-semibold text-brown-text">{t('inventory.addItem')}</p>
        <div className="grid grid-cols-2 gap-3 xs:grid-cols-[2fr_1fr_1fr_auto] xs:items-end">
          <div>
            <label className={labelClass}>{t('inventory.name')}</label>
            <HfInput type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('inventory.namePlaceholder')} />
          </div>
          <div>
            <label className={labelClass}>{t('inventory.unit')}</label>
            <HfInput type="text" value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder={t('inventory.unitPlaceholder')} />
          </div>
          <div>
            <label className={labelClass}>{t('inventory.lowStockThreshold')}</label>
            <HfInput type="number" min="0" step="0.01" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} placeholder={t('common.optional')} />
          </div>
          <button onClick={submitNew} disabled={createMutation.isLoading} className={classNames(saveBtnClass, 'col-span-2 xs:col-span-1')}>
            {createMutation.isLoading ? t('common.saving') : t('inventory.add')}
          </button>
        </div>
      </div>

      {deletingItem && (
        <ConfirmModal
          title={t('inventory.confirmDeleteTitle')}
          body={t('common.deleteWarning')}
          isConfirming={deleteMutation.isLoading}
          onCancel={() => setDeletingItem(null)}
          onConfirm={() => deleteMutation.mutate(deletingItem.id)}
        />
      )}
    </div>
  )
}

export default Inventory
