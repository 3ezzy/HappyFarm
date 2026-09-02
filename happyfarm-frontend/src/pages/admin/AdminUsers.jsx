import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../services/api/admin.js'
import { useAuth } from '../../context/AuthContext.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import ConfirmModal from '../../components/common/UI/ConfirmModal.jsx'
import { cardClass, fmtDate, Pill, EmptyState } from '../../theme/hf.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const STATUSES = ['pending', 'approved', 'rejected', 'suspended']
const STATUS_TONE = { pending: 'warn', approved: 'ok', rejected: 'danger', suspended: 'hold' }

const filterBtnClass = (active) =>
  classNames(
    'cursor-pointer rounded-pill border px-4 py-1.5 text-[13.5px] font-medium transition-colors duration-hf',
    active ? 'border-meadow-700 bg-meadow-700 text-white' : 'border-line-strong bg-surface-card text-ink-700'
  )

const actionBtnClass = (tone) =>
  classNames(
    'cursor-pointer rounded border-none px-4 py-1.5 text-[13px] font-medium text-white transition-colors duration-hf',
    'enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45',
    tone === 'ok' ? 'bg-ok-fg' : 'bg-danger-fg'
  )

/**
 * Admin-only user review/approval dashboard. Only reachable via AdminRoute
 * (role === 'admin'); the backend's EnsureUserIsAdmin middleware is the
 * actual authority — this page is convenience, not security.
 */
const AdminUsers = () => {
  const { t, i18n } = useTranslation()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('pending')
  const [suspendingUser, setSuspendingUser] = useState(null) // user object or null

  const { data: users = [], isLoading } = useQuery(
    ['admin-users', status],
    () => adminService.listUsers(status)
  )

  const invalidate = () => queryClient.invalidateQueries(['admin-users', status])

  const approveMutation = useMutation((id) => adminService.approveUser(id), {
    onSuccess: async () => {
      await invalidate()
      toast.success(t('admin.userApprovedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const rejectMutation = useMutation((id) => adminService.rejectUser(id), {
    onSuccess: async () => {
      await invalidate()
      toast.success(t('admin.userRejectedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const suspendMutation = useMutation((id) => adminService.suspendUser(id), {
    onSuccess: async () => {
      await invalidate()
      setSuspendingUser(null)
      toast.success(t('admin.userSuspendedToast'))
    },
    onError: (error) => {
      setSuspendingUser(null)
      toast.error(apiErrorMessage(error, t('common.error')))
    },
  })

  const reactivateMutation = useMutation((id) => adminService.reactivateUser(id), {
    onSuccess: async () => {
      await invalidate()
      toast.success(t('admin.userReactivatedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  return (
    <div>
      <h1 className="mb-1 text-[34px]">{t('admin.title')}</h1>
      <p className="mb-[22px] text-ink-500">{t('admin.subtitle')}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={filterBtnClass(status === s)}>
            {t(`admin.status.${s}`)}
          </button>
        ))}
      </div>

      <div className={classNames(cardClass, 'p-6')}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="large" message={t('common.loading')} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState title={t('admin.empty')} />
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-lg border border-line bg-surface-sunken px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-semibold text-ink-900">{u.name}</span>
                      <Pill tone={STATUS_TONE[u.status]}>{t(`admin.status.${u.status}`)}</Pill>
                      {u.role === 'admin' && <Pill tone="ok">{t('admin.role.admin')}</Pill>}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-ink-500">{u.email}</p>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">
                      {t('admin.farmLabel', { farm: u.farm_name || t('common.none') })} · {t('admin.registeredOn', { date: fmtDate(u.created_at, i18n.language) })}
                    </p>
                  </div>

                  {u.status === 'pending' && (
                    <div className="flex flex-none gap-2">
                      <button
                        onClick={() => approveMutation.mutate(u.id)}
                        disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        className={actionBtnClass('ok')}
                      >
                        {t('admin.approve')}
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(u.id)}
                        disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        className={actionBtnClass('danger')}
                      >
                        {t('admin.reject')}
                      </button>
                    </div>
                  )}

                  {/* Suspend is hidden for the admin's own row — the backend
                      also rejects this, this just avoids the confusing
                      round-trip of clicking it and getting an error. */}
                  {u.status === 'approved' && u.id !== currentUser?.id && (
                    <div className="flex flex-none gap-2">
                      <button
                        onClick={() => setSuspendingUser(u)}
                        className={actionBtnClass('danger')}
                      >
                        {t('admin.suspend')}
                      </button>
                    </div>
                  )}

                  {u.status === 'suspended' && (
                    <div className="flex flex-none gap-2">
                      <button
                        onClick={() => reactivateMutation.mutate(u.id)}
                        disabled={reactivateMutation.isLoading}
                        className={actionBtnClass('ok')}
                      >
                        {t('admin.reactivate')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {suspendingUser && (
        <ConfirmModal
          title={t('admin.confirmSuspendTitle', { name: suspendingUser.name })}
          body={t('admin.confirmSuspendBody')}
          confirmLabel={t('admin.suspend')}
          isConfirming={suspendMutation.isLoading}
          onCancel={() => setSuspendingUser(null)}
          onConfirm={() => suspendMutation.mutate(suspendingUser.id)}
        />
      )}
    </div>
  )
}

export default AdminUsers
