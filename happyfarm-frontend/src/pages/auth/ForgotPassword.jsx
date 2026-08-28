import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
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
    <div className="hf-leaf-bg flex min-h-screen animate-hf-fade items-center justify-center bg-pageBg px-5 py-8">
      <div className="relative w-full max-w-[430px]">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2.5">
            <span className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-[14px] bg-green shadow-ribbon">
              <LeafMark size={26} color={C.leafPale} />
            </span>
            <span className="font-display text-3xl font-bold text-brown-text">HappyFarm</span>
          </div>
          <p className="mt-3 text-[15px] text-brown">{t('auth.forgotPasswordTagline')}</p>
        </div>

        <div className="animate-hf-pop rounded-2xl bg-cream p-7 shadow-card">
          {sent ? (
            <div className="text-center">
              <p className="mb-5 text-[15px] text-brown-text">{t('auth.forgotPasswordSentMessage')}</p>
              <Link to="/login" className="font-display text-[15px] font-bold text-green">
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
              <button onClick={submit} disabled={forgotPasswordMutation.isLoading} className={submitClass}>
                {forgotPasswordMutation.isLoading ? t('auth.sending') : t('auth.sendResetLink')}
              </button>
              <p className="mt-4 text-center text-[13px] text-tan">
                <Link to="/login" className="font-semibold text-brown-text">{t('auth.backToLogin')}</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
