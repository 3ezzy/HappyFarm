import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { AlertRow, HfInput, btnPrimary } from '../../theme/hf.jsx'
import { Logo } from '../../theme/logo.jsx'

const labelClass = 'mb-2 block text-sm font-medium text-ink-900'

const tabClass = (active) =>
  classNames(
    'flex-1 cursor-pointer rounded border-none p-[9px] font-sans text-sm font-medium transition-colors duration-hf',
    active ? 'bg-surface-card text-ink-900 shadow-e1' : 'bg-transparent text-ink-500'
  )

const AuthScreen = ({ mode }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { login, register, isLoading, error } = useAuth()
  const isLogin = mode === 'login'

  const [loginEmail, setLoginEmail] = useState('ali@example.com')
  const [loginPass, setLoginPass] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPass, setRegPass] = useState('')

  const doLogin = async () => {
    try {
      await login({ email: loginEmail, password: loginPass })
      navigate('/')
    } catch (_) {
      /* error surfaced via context + toast */
    }
  }

  const doRegister = async () => {
    try {
      const data = await register({
        name: regName,
        email: regEmail,
        password: regPass,
        password_confirmation: regPass,
      })
      // A pending account gets no token — stay on the auth screen (on the
      // login tab) instead of navigating into a protected route that
      // would just bounce back out via ProtectedRoute.
      if (data.token) {
        navigate('/')
      } else {
        navigate('/login')
      }
    } catch (_) {
      /* error surfaced via context + toast */
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page px-5 py-8">
      <div className="relative w-full max-w-[430px]">
        <div className="mb-6 text-center">
          <Logo size={40} className="justify-center" textClassName="text-3xl" />
          <p className="mt-3 text-[15px] text-ink-500">{t('auth.tagline')}</p>
        </div>

        <div className="rounded-lg border border-line bg-surface-card p-7 shadow-e2">
          <div className="mb-[22px] flex rounded bg-surface-sunken p-1">
            <button onClick={() => navigate('/login')} className={tabClass(isLogin)}>{t('auth.login')}</button>
            <button onClick={() => navigate('/register')} className={tabClass(!isLogin)}>{t('auth.register')}</button>
          </div>

          {error && <AlertRow severity="danger" title={error} className="mb-4" />}

          {isLogin ? (
            <div>
              <label htmlFor="le" className={labelClass}>{t('auth.email')}</label>
              <HfInput
                id="le"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-4"
              />
              <label htmlFor="lp" className={labelClass}>{t('auth.password')}</label>
              <HfInput
                id="lp"
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                placeholder="••••••••"
                className="mb-2.5"
              />
              <p className="mb-[22px] text-end">
                <Link to="/forgot-password" className="text-[13px] font-medium text-ink-700">
                  {t('auth.forgotPasswordLink')}
                </Link>
              </p>
              <button onClick={doLogin} disabled={isLoading} className={classNames(btnPrimary, 'w-full')}>
                {isLoading ? t('auth.loggingIn') : t('auth.login')} <span className="text-lg rtl:rotate-180">→</span>
              </button>
              {/* <p className="mt-4 text-center text-[13px] text-ink-500">
                {t('auth.demoHintPrefix')} <strong className="text-ink-900">ali@example.com</strong>
              </p> */}
            </div>
          ) : (
            <div>
              <label htmlFor="rn" className={labelClass}>{t('auth.fullName')}</label>
              <HfInput
                id="rn"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ali Eid"
                className="mb-4"
              />
              <label htmlFor="re" className={labelClass}>{t('auth.email')}</label>
              <HfInput
                id="re"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-4"
              />
              <label htmlFor="rp" className={labelClass}>{t('auth.password')}</label>
              <HfInput
                id="rp"
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doRegister()}
                placeholder="••••••••"
                className="mb-[22px]"
              />
              <button onClick={doRegister} disabled={isLoading} className={classNames(btnPrimary, 'w-full')}>
                {isLoading ? t('auth.creating') : t('auth.createFarmCta')} <span className="text-lg rtl:rotate-180">→</span>
              </button>
              <p className="mt-4 text-center text-[13px] text-ink-500">
                {t('auth.farmAutoCreated')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthScreen
