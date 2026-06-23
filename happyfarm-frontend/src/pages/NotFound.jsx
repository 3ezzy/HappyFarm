import React from 'react'
import { useNavigate } from 'react-router-dom'
import { C, Hoverable, LeafMark } from '../theme/hf.jsx'

const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div className="hf-leaf-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.pageBg, padding: '24px' }}>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', width: '56px', height: '56px', alignItems: 'center', justifyContent: 'center', background: C.green, borderRadius: '16px', marginBottom: '16px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }}>
          <LeafMark size={30} color="#BEE6D5" />
        </span>
        <h1 style={{ fontSize: '64px', marginBottom: '4px' }}>404</h1>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Page not found</h2>
        <p style={{ color: C.tan, margin: '0 0 24px' }}>This pasture seems to be empty.</p>
        <Hoverable
          onClick={() => navigate('/')}
          baseStyle={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: C.brown,
            color: '#fff',
            fontFamily: "'Zilla Slab', serif",
            fontWeight: 700,
            fontSize: '15px',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '9999px',
            boxShadow: '0 2px 4px rgba(107,92,67,0.16)',
            cursor: 'pointer',
            transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .2s',
          }}
          hoverStyle={{ transform: 'scale(1.03)', background: C.brownDark }}
        >
          Go home <span style={{ fontSize: '18px' }}>→</span>
        </Hoverable>
      </div>
    </div>
  )
}

export default NotFound
