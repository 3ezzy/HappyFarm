import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { C, Hoverable, HfInput, LeafMark } from '../../theme/hf.jsx'

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: C.brownText,
  marginBottom: '8px',
}

const submitStyle = {
  display: 'flex',
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  background: C.brown,
  color: '#fff',
  fontFamily: "'Zilla Slab', serif",
  fontWeight: 700,
  fontSize: '16px',
  padding: '13px',
  border: 'none',
  borderRadius: '9999px',
  boxShadow: '0 2px 4px rgba(107,92,67,0.16)',
  cursor: 'pointer',
  transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .2s,box-shadow .2s',
}
const submitHover = { transform: 'scale(1.03)', background: C.brownDark, boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }

const tabStyle = (active) => ({
  flex: 1,
  border: 'none',
  cursor: 'pointer',
  fontFamily: "'Zilla Slab', serif",
  fontWeight: 700,
  fontSize: '15px',
  padding: '9px',
  borderRadius: '9999px',
  transition: 'all .2s',
  ...(active
    ? { background: C.cream, color: C.brownText, boxShadow: '0 2px 4px rgba(107,92,67,0.16)' }
    : { background: 'transparent', color: C.tan }),
})

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
    <div
      className="hf-leaf-bg hf-anim-fade"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background: C.pageBg,
      }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: '430px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-flex',
                width: '46px',
                height: '46px',
                alignItems: 'center',
                justifyContent: 'center',
                background: C.green,
                borderRadius: '14px',
                boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)',
              }}
            >
              <LeafMark size={26} color="#BEE6D5" />
            </span>
            <span style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '30px', color: C.brownText }}>
              HappyFarm
            </span>
          </div>
          <p style={{ margin: '12px 0 0', color: C.brown, fontSize: '15px' }}>
            Eid Mubarak 🌙 — tend your flock with care.
          </p>
        </div>

        <div
          className="hf-anim-pop"
          style={{ background: C.cream, borderRadius: '16px', boxShadow: '0 16px 30px -5px rgba(107,92,67,0.26)', padding: '28px' }}
        >
          <div style={{ display: 'flex', background: C.greenSoft2, borderRadius: '9999px', padding: '4px', marginBottom: '22px' }}>
            <button onClick={() => navigate('/login')} style={tabStyle(isLogin)}>Log in</button>
            <button onClick={() => navigate('/register')} style={tabStyle(!isLogin)}>Register</button>
          </div>

          {error && (
            <div
              style={{
                background: '#FCE7E5',
                border: '2px solid #F6CFCB',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                fontSize: '13.5px',
                color: C.redDark,
              }}
            >
              {error}
            </div>
          )}

          {isLogin ? (
            <div>
              <label htmlFor="le" style={labelStyle}>Email</label>
              <HfInput
                id="le"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ marginBottom: '16px' }}
              />
              <label htmlFor="lp" style={labelStyle}>Password</label>
              <HfInput
                id="lp"
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                placeholder="••••••••"
                style={{ marginBottom: '22px' }}
              />
              <Hoverable onClick={doLogin} disabled={isLoading} baseStyle={{ ...submitStyle, opacity: isLoading ? 0.7 : 1 }} hoverStyle={submitHover}>
                {isLoading ? 'Logging in…' : 'Log in'} <span style={{ fontSize: '18px' }}>→</span>
              </Hoverable>
              <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: '13px', color: C.tan }}>
                Demo — try <strong style={{ color: C.brownText }}>ali@example.com</strong>
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="rn" style={labelStyle}>Full name</label>
              <HfInput
                id="rn"
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ali Eid"
                style={{ marginBottom: '16px' }}
              />
              <label htmlFor="re" style={labelStyle}>Email</label>
              <HfInput
                id="re"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ marginBottom: '16px' }}
              />
              <label htmlFor="rp" style={labelStyle}>Password</label>
              <HfInput
                id="rp"
                type="password"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doRegister()}
                placeholder="••••••••"
                style={{ marginBottom: '22px' }}
              />
              <Hoverable onClick={doRegister} disabled={isLoading} baseStyle={{ ...submitStyle, opacity: isLoading ? 0.7 : 1 }} hoverStyle={submitHover}>
                {isLoading ? 'Creating…' : 'Create farm'} <span style={{ fontSize: '18px' }}>→</span>
              </Hoverable>
              <p style={{ textAlign: 'center', margin: '16px 0 0', fontSize: '13px', color: C.tan }}>
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
