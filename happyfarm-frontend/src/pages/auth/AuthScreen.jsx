import React, { useState } from 'react'
import classNames from 'classnames'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { C, HfInput, LeafMark } from '../../theme/hf.jsx'

const labelClass = 'mb-2 block text-sm font-medium text-brown-text'

const submitClass =
  'flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none ' +
  'bg-brown p-[13px] font-display text-base font-bold text-white shadow-soft ' +
  'transition-all duration-200 ease-pop ' +
  'enabled:hover:scale-[1.03] enabled:hover:bg-brown-dark enabled:hover:shadow-ribbon ' +
  'disabled:cursor-not-allowed disabled:opacity-70'

const tabClass = (active) =>
  classNames(
    'flex-1 cursor-pointer rounded-full border-none p-[9px] font-display text-[15px] font-bold transition-all duration-200',
    active ? 'bg-cream text-brown-text shadow-soft' : 'bg-transparent text-tan'
  )

const AuthScreen = ({ mode }) => {
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
      await register({
        name: regName,
        email: regEmail,
        password: regPass,
        password_confirmation: regPass,
      })
      navigate('/')
    } catch (_) {
      /* error surfaced via context + toast */
    }
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
          <p className="mt-3 text-[15px] text-brown">Eid Mubarak 🌙 — tend your flock with care.</p>
        </div>

        <div className="animate-hf-pop rounded-2xl bg-cream p-7 shadow-card">
          <div className="mb-[22px] flex rounded-full bg-green-soft2 p-1">
            <button onClick={() => navigate('/login')} className={tabClass(isLogin)}>Log in</button>
            <button onClick={() => navigate('/register')} className={tabClass(!isLogin)}>Register</button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border-2 border-red-line bg-red-soft px-3.5 py-2.5 text-[13.5px] text-red-dark">
              {error}
            </div>
          )}

          {isLogin ? (
            <div>
              <label htmlFor="le" className={labelClass}>Email</label>
              <HfInput
                id="le"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-4"
              />
              <label htmlFor="lp" className={labelClass}>Password</label>
              <HfInput
                id="lp"
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                placeholder="••••••••"
                className="mb-[22px]"
              />
              <button onClick={doLogin} disabled={isLoading} className={submitClass}>
                {isLoading ? 'Logging in…' : 'Log in'} <span className="text-lg">→</span>
              </button>
              <p className="mt-4 text-center text-[13px] text-tan">
                Demo — try <strong className="text-brown-text">ali@example.com</strong>
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="rn" className={labelClass}>Full name</label>
              <HfInput
                id="rn"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ali Eid"
                className="mb-4"
              />
              <label htmlFor="re" className={labelClass}>Email</label>
              <HfInput
                id="re"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                className="mb-4"
              />
              <label htmlFor="rp" className={labelClass}>Password</label>
              <HfInput
                id="rp"
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doRegister()}
                placeholder="••••••••"
                className="mb-[22px]"
              />
              <button onClick={doRegister} disabled={isLoading} className={submitClass}>
                {isLoading ? 'Creating…' : 'Create farm'} <span className="text-lg">→</span>
              </button>
              <p className="mt-4 text-center text-[13px] text-tan">
                Your farm is created automatically. 🌾
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthScreen
