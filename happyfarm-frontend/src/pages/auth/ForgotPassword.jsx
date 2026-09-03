import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useMutation } from 'react-query'
import toast from 'react-hot-toast'
import { authService } from '../../services/api/auth.js'
import { apiErrorMessage } from '../../utils/apiError.js'
import { HfInput, btnPrimary } from '../../theme/hf.jsx'
import { Logo } from '../../theme/logo.jsx'

const labelClass = 'mb-2 block text-sm font-medium text-ink-900'

const ForgotPassword = () => {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const forgotPasswordMutation = useMutation((email) => authService.forgotPassword(email), {
    onSuccess: () => setSent(true),
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const submit = () => {
    if (!email.trim()) {
      toast.error(t('auth.emailRequired'))
      return
    }
    forgotPasswordMutation.mutate(email.trim())
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-5 py-8">
      <div className="relative w-full max-w-[430px]">
        <div className="mb-6 text-center">
          <Logo size={40} className="justify-center" textClassName="text-3xl" />
          <p className="mt-3 text-[15px] text-ink-500">{t('auth.forgotPasswordTagline')}</p>
        </div>

        <div className="rounded-lg border border-line bg-surface-card p-7 shadow-e2">
          {sent ? (
            <div className="text-center">
              <p className="mb-5 text-[15px] text-ink-900">{t('auth.forgotPasswordSentMessage')}</p>
              <Link to="/login" className="font-display text-[15px] font-semibold text-meadow-700">
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <div>
              <label htmlFor="fpe" className={labelClass}>{t('auth.email')}</label>
              <HfInput
                id="fpe"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="you@example.com"
                className="mb-[22px]"
              />
              <button onClick={submit} disabled={forgotPasswordMutation.isLoading} className={classNames(btnPrimary, 'w-full')}>
                {forgotPasswordMutation.isLoading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
              <p className="mt-4 text-center text-[13px] text-ink-500">
                <Link to="/login" className="font-medium text-ink-900">{t('auth.backToLogin')}</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
