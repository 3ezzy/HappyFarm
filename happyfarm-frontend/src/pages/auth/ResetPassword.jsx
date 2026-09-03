import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/api/auth.js'
import { apiErrorMessage } from '../../utils/apiError.js'
import { HfInput, btnPrimary } from '../../theme/hf.jsx'
import { Logo } from '../../theme/logo.jsx'

const labelClass = 'mb-2 block text-sm font-medium text-ink-900'

const CardShell = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-surface-page px-5 py-8">
    <div className="relative w-full max-w-[430px]">
      <div className="mb-6 text-center">
        <Logo size={40} className="justify-center" textClassName="text-3xl" />
      </div>
      <div className="rounded-lg border border-line bg-surface-card p-7 shadow-e2">{children}</div>
    </div>
  </div>
)

const ResetPassword = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const resetPasswordMutation = useMutation(
    () => authService.resetPassword({ token, email, password, passwordConfirmation: confirmPassword }),
    {
      onSuccess: (data) => {
        toast.success(data.message)
        navigate('/login')
      },
      onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
    }
  )

  const submit = () => {
    if (!password || !confirmPassword) {
      toast.error(t('auth.passwordFieldsRequired'))
      return
    }
    resetPasswordMutation.mutate()
  }

  if (!token || !email) {
    return (
      <CardShell>
        <div className="text-center">
          <p className="mb-5 text-[15px] text-ink-900">{t('auth.resetLinkInvalid')}</p>
          <Link to="/forgot-password" className="font-display text-[15px] font-semibold text-meadow-700">
            {t('auth.requestNewResetLink')}
          </Link>
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell>
      <p className="mb-5 text-center text-[15px] text-ink-500">{t('auth.resetPasswordTagline')}</p>
      <label htmlFor="rpp" className={labelClass}>{t('auth.newPassword')}</label>
      <HfInput
        id="rpp"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        className="mb-4"
      />
      <label htmlFor="rpc" className={labelClass}>{t('auth.confirmNewPassword')}</label>
      <HfInput
        id="rpc"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="••••••••"
        className="mb-[22px]"
      />
      <button onClick={submit} disabled={resetPasswordMutation.isLoading} className={classNames(btnPrimary, 'w-full')}>
        {resetPasswordMutation.isLoading ? t('auth.resetting') : t('auth.resetPassword')}
      </button>
      <p className="mt-4 text-center text-[13px] text-ink-500">
        <Link to="/login" className="font-medium text-ink-900">{t('auth.backToLogin')}</Link>
      </p>
    </CardShell>
  )
}

export default ResetPassword
