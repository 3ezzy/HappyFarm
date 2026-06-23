import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { C, Hoverable, LeafMark, initialsOf } from '../../../theme/hf.jsx'

const NavButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'Zilla Slab', serif",
      fontWeight: 700,
      fontSize: '16px',
      color: C.brownText,
      padding: 0,
      whiteSpace: 'nowrap',
      transform: active ? 'translateY(-1px)' : 'none',
    }}
  >
    {label}
    {active && (
      <span style={{ display: 'block', height: '2px', borderRadius: '2px', background: C.brownText, marginTop: '3px' }} />
    )}
  </button>
)

const Header = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { user } = useAuth()

  const isDashboard = pathname === '/'
  const isAnimals = pathname.startsWith('/animals')
  const isFarm = pathname === '/farm'
  const isProfile = pathname === '/profile'

  return (
    <div style={{ position: 'relative' }}>
      {/* Eid utility strip */}
      <div
        style={{
          background: C.red,
          color: '#fff',
          textAlign: 'center',
          fontSize: '12.5px',
          letterSpacing: '.3px',
          padding: '6px 16px',
          fontWeight: 500,
        }}
      >
        🌙 Eid Al Adha — may your sacrifice be accepted · تقبل الله
      </div>

      {/* Green ribbon nav */}
      <header className="hf-leaf-bg-header" style={{ position: 'relative', background: C.green, padding: '18px 16px 30px' }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '12px',
            background: `radial-gradient(circle 8px at 10px 0,${C.green} 97%,transparent 100%) repeat-x`,
            backgroundSize: '20px 12px',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: '1152px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: '9px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span
              style={{
                display: 'inline-flex',
                width: '38px',
                height: '38px',
                alignItems: 'center',
                justifyContent: 'center',
                background: C.cream,
                borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
              }}
            >
              <LeafMark size={22} color={C.green} />
            </span>
            <span style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '21px', color: C.cream }}>HappyFarm</span>
          </button>

          {/* yellow ribbon */}
          <nav
            style={{
              background: C.yellow,
              padding: '11px 30px',
              boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)',
              clipPath: 'polygon(0 0,100% 0,calc(100% - 16px) 50%,100% 100%,0 100%,16px 50%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
              <NavButton label="Home" active={isDashboard} onClick={() => navigate('/')} />
              <NavButton label="Animals" active={isAnimals} onClick={() => navigate('/animals')} />
              <NavButton label="Farm" active={isFarm} onClick={() => navigate('/farm')} />
              <NavButton label="Profile" active={isProfile} onClick={() => navigate('/profile')} />
            </div>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Hoverable
              onClick={() => navigate('/animals/add')}
              baseStyle={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: C.cream,
                color: C.brownText,
                fontFamily: "'Zilla Slab', serif",
                fontWeight: 700,
                fontSize: '14px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '9999px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.16)',
                cursor: 'pointer',
                transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55)',
              }}
              hoverStyle={{ transform: 'scale(1.05)' }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add
            </Hoverable>
            <button
              onClick={() => navigate('/profile')}
              title="Profile"
              style={{
                width: '38px',
                height: '38px',
                border: 'none',
                borderRadius: '9999px',
                background: C.greenDark,
                color: '#fff',
                fontFamily: "'Zilla Slab', serif",
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.18)',
              }}
            >
              {initialsOf(user?.name)}
            </button>
          </div>
        </div>
      </header>
    </div>
  )
}

export default Header
