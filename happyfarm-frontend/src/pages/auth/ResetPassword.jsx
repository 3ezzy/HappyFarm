import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/api/auth.js'
import { apiErrorMessage } from '../../utils/apiError.js'
import { C, HfInput, LeafMark } from '../../theme/hf.jsx'

const labelClass = 'mb-2 block text-sm font-medium text-brown-text'

const submitClass =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none ' +
  'bg-brown p-[13px] font-display text-base font-bold text-white shadow-soft ' +
  'transition-all duration-200 ease-pop ' +
  'enabled:hover:scale-[1.03] enabled:hover:bg-brown-dark enabled:hover:shadow-ribbon ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

const CardShell = ({ children }) => (
  <div className="hf-leaf-bg flex min-h-screen animate-hf-fade items-center justify-center bg-pageBg px-5 py-8">
    <div className="relative w-full max-w-[430px]">
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2.5">
          <span className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-green shadow-ribbon">
            <LeafMark size={26} color={C.leafPale} />
          </span>
          <span className="font-display text-3xl font-bold text-brown-text">HappyFarm</span>
        </div>
      </div>
      <div className="animate-hf-pop rounded-2xl bg-cream p-7 shadow-card">{children}</div>
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
          <p className="mb-5 text-[15px] text-brown-text">{t('auth.resetLinkInvalid')}</p>
          <Link to="/forgot-password" className="font-display text-[15px] font-bold text-green">
            {t('auth.requestNewResetLink')}
          </Link>
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell>
      <p className="mb-5 text-center text-[15px] text-brown">{t('auth.resetPasswordTagline')}</p>
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
      <button onClick={submit} disabled={resetPasswordMutation.isLoading} className={submitClass}>
        {resetPasswordMutation.isLoading ? t('auth.resetting') : t('auth.resetPassword')}
      </button>
      <p className="mt-4 text-center text-[13px] text-tan">
        <Link to="/login" className="font-semibold text-brown-text">{t('auth.backToLogin')}</Link>
      </p>
    </CardShell>
  )
}

export default ResetPassword
