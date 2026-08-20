import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext.jsx'
import { farmService } from '../../services/api/farm.js'
import { authService } from '../../services/api/auth.js'
import { initialsOf, HfInput, cardClass } from '../../theme/hf.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const labelClass = 'mb-1.5 block text-xs font-semibold text-brown-text'

const saveBtnClass =
  'cursor-pointer rounded-2xl border-none bg-green px-5 py-2.5 font-display text-sm font-bold text-white ' +
  'shadow-chip transition-transform duration-200 ease-pop enabled:hover:scale-[1.03] ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

const Profile = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, farm, logout, updateFarmName } = useAuth()

  const { data: farmDetails } = useQuery('farm-details', farmService.getDetails, { refetchOnWindowFocus: false })

  const createdAt = farmDetails?.created_at
  const memberSince = createdAt
    ? new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric', numberingSystem: 'latn' }).format(new Date(createdAt))
    : '—'

  const [farmNameInput, setFarmNameInput] = useState('')
  useEffect(() => {
    if (farmDetails?.name) setFarmNameInput(farmDetails.name)
  }, [farmDetails?.name])

  const renameFarmMutation = useMutation((name) => farmService.updateName(name), {
    onSuccess: async (data) => {
      updateFarmName(data)
      await Promise.all([
        queryClient.invalidateQueries('farm-details'),
        queryClient.invalidateQueries('farm-statistics'),
      ])
      toast.success(t('profile.farmRenamedToast'))
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const submitFarmName = () => {
    const trimmed = farmNameInput.trim()
    if (!trimmed) {
      toast.error(t('profile.farmNameRequired'))
      return
    }
    renameFarmMutation.mutate(trimmed)
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const changePasswordMutation = useMutation(
    () => authService.updatePassword({ currentPassword, password: newPassword, passwordConfirmation: confirmPassword }),
    {
      onSuccess: () => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        toast.success(t('profile.passwordChangedToast'))
      },
      onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
    }
  )

  const submitPasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('profile.passwordFieldsRequired'))
      return
    }
    changePasswordMutation.mutate()
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-[680px] animate-hf-pop">
      <h1 className="mb-[22px] text-[34px]">{t('profile.title')}</h1>

      <div className="mb-6 rounded-2xl bg-cream p-7 shadow-ribbon">
        <div className="flex items-center gap-[18px]">
          <span className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green font-display text-[26px] font-bold text-white shadow-ribbon">
            {initialsOf(user?.name)}
          </span>
          <div>
            <h2 className="text-[26px]">{user?.name}</h2>
            <p className="mt-1 text-tan">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3.5 xs:grid-cols-2">
          <div className="rounded-2xl bg-green-soft p-4">
            <p className="text-[13px] font-medium text-tan">{t('profile.farm')}</p>
            <p className="mt-[3px] font-display text-base font-bold text-brown-text">{farm?.name}</p>
          </div>
          <div className="rounded-2xl bg-green-soft p-4">
            <p className="text-[13px] font-medium text-tan">{t('profile.memberSince')}</p>
            <p className="mt-[3px] font-display text-base font-bold text-brown-text">{memberSince}</p>
          </div>
        </div>
      </div>

      <div className={`${cardClass} mb-6 p-6`}>
        <h2 className="mb-4 text-[22px]">{t('profile.accountSettings')}</h2>

        <div className="mb-6 border-b border-cream-muted pb-6">
          <label className={labelClass}>{t('profile.farmName')}</label>
          <div className="flex flex-col gap-3 xs:flex-row xs:items-center">
            <HfInput
              type="text"
              value={farmNameInput}
              onChange={(e) => setFarmNameInput(e.target.value)}
              className="xs:flex-1"
            />
            <button onClick={submitFarmName} disabled={renameFarmMutation.isLoading} className={saveBtnClass}>
              {renameFarmMutation.isLoading ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-[15px] font-semibold text-brown-text">{t('profile.changePassword')}</h3>
          <div className="grid grid-cols-1 gap-3.5 xs:grid-cols-2">
            <div className="xs:col-span-2">
              <label className={labelClass}>{t('profile.currentPassword')}</label>
              <HfInput type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className={labelClass}>{t('profile.newPassword')}</label>
              <HfInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div>
              <label className={labelClass}>{t('profile.confirmPassword')}</label>
              <HfInput type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button
            onClick={submitPasswordChange}
            disabled={changePasswordMutation.isLoading}
            className={`${saveBtnClass} mt-4`}
          >
            {changePasswordMutation.isLoading ? t('common.saving') : t('profile.updatePassword')}
          </button>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-red-line bg-cream px-6 py-3 font-display text-[15px] font-bold text-red-dark transition-all duration-200 ease-pop hover:scale-[1.03] hover:bg-red-soft"
      >
        {t('profile.logOut')}
      </button>
    </div>
  )
}

export default Profile
