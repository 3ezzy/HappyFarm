import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { adminService } from '../../services/api/admin.js'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { badge, cardClass, fmtDate } from '../../theme/hf.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const STATUSES = ['pending', 'approved', 'rejected']

const filterBtnClass = (active) =>
  classNames(
    'cursor-pointer rounded-full border-2 px-4 py-1.5 font-display text-[13.5px] font-bold transition-all duration-200',
    active ? 'border-green bg-green text-white' : 'border-line bg-cream text-brown'
  )

const actionBtnClass =
  'cursor-pointer rounded-full border-none px-4 py-1.5 font-display text-[13px] font-bold text-white ' +
  'shadow-chip transition-transform duration-200 ease-pop enabled:hover:scale-[1.04] ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

/**
 * Admin-only user review/approval dashboard. Only reachable via AdminRoute
 * (role === 'admin'); the backend's EnsureUserIsAdmin middleware is the
 * actual authority — this page is convenience, not security.
 */
const AdminUsers = () => {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('pending')

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

  return (
    <div className="animate-hf-pop">
      <h1 className="mb-1 text-[34px]">{t('admin.title')}</h1>
      <p className="mb-[22px] text-tan">{t('admin.subtitle')}</p>

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
          <p className="text-sm text-tan">{t('admin.empty')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-xl bg-cream px-4 py-3 shadow-chip">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-bold text-brown-text">{u.name}</span>
                      <span className={badge(u.status)}>{t(`admin.status.${u.status}`)}</span>
                      {u.role === 'admin' && <span className={badge('active')}>{t('admin.role.admin')}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-tan">{u.email}</p>
                    <p className="mt-0.5 text-[12.5px] text-tan">
                      {t('admin.farmLabel', { farm: u.farm_name || t('common.none') })} · {t('admin.registeredOn', { date: fmtDate(u.created_at, i18n.language) })}
                    </p>
                  </div>

                  {u.status === 'pending' && (
                    <div className="flex flex-none gap-2">
                      <button
                        onClick={() => approveMutation.mutate(u.id)}
                        disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        className={classNames(actionBtnClass, 'bg-green')}
                      >
                        {t('admin.approve')}
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(u.id)}
                        disabled={approveMutation.isLoading || rejectMutation.isLoading}
                        className={classNames(actionBtnClass, 'bg-red')}
                      >
                        {t('admin.reject')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers
