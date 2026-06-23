import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useAuth } from '../../context/AuthContext.jsx'
import { farmService } from '../../services/api/farm.js'
import { C, Hoverable, initialsOf } from '../../theme/hf.jsx'

const card = { background: C.cream, borderRadius: '16px', padding: '28px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }

const Toggle = ({ on, onClick }) => (
  <button
    onClick={onClick}
    style={{
      width: '46px',
      height: '26px',
      borderRadius: '9999px',
      border: 'none',
      padding: '3px',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      transition: 'background-color .2s',
      background: on ? C.green : '#D9E8D2',
      justifyContent: on ? 'flex-end' : 'flex-start',
    }}
  >
    <span style={{ display: 'block', width: '20px', height: '20px', borderRadius: '9999px', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
  </button>
)

const Profile = () => {
  const navigate = useNavigate()
  const { user, farm, logout } = useAuth()
  const [reminders, setReminders] = useState(true)
  const [greetings, setGreetings] = useState(true)

  const { data: farmDetails } = useQuery('farm-details', farmService.getDetails, { refetchOnWindowFocus: false })

  const createdAt = farmDetails?.created_at
  const memberSince = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="hf-anim-pop" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '34px', marginBottom: '22px' }}>Profile</h1>

      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span style={{ display: 'inline-flex', width: '72px', height: '72px', alignItems: 'center', justifyContent: 'center', background: C.green, color: '#fff', borderRadius: '9999px', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '26px', boxShadow: '0 4px 10px -1px rgba(107,92,67,0.20)' }}>
            {initialsOf(user?.name)}
          </span>
          <div>
            <h2 style={{ fontSize: '26px' }}>{user?.name}</h2>
            <p style={{ margin: '4px 0 0', color: C.tan }}>{user?.email}</p>
          </div>
        </div>
        <div className="hf-care-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '24px' }}>
          <div style={{ background: C.greenSoft, borderRadius: '16px', padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: C.tan, fontWeight: 500 }}>Farm</p>
            <p style={{ margin: '3px 0 0', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '16px', color: C.brownText }}>{farm?.name}</p>
          </div>
          <div style={{ background: C.greenSoft, borderRadius: '16px', padding: '16px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: C.tan, fontWeight: 500 }}>Member since</p>
            <p style={{ margin: '3px 0 0', fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '16px', color: C.brownText }}>{memberSince}</p>
          </div>
        </div>
      </div>

      <div style={{ ...card, padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '22px', marginBottom: '16px' }}>Preferences</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #ECE7D2' }}>
          <span style={{ fontSize: '15px', color: C.brown }}>Care reminders</span>
          <Toggle on={reminders} onClick={() => setReminders((v) => !v)} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
          <span style={{ fontSize: '15px', color: C.brown }}>Eid greetings</span>
          <Toggle on={greetings} onClick={() => setGreetings((v) => !v)} />
        </div>
      </div>

      <Hoverable
        onClick={handleLogout}
        baseStyle={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: C.cream,
          color: C.redDark,
          fontFamily: "'Zilla Slab', serif",
          fontWeight: 700,
          fontSize: '15px',
          padding: '12px 24px',
          border: '2px solid #F6CFCB',
          borderRadius: '9999px',
          cursor: 'pointer',
          transition: 'transform .2s cubic-bezier(0.68,-0.55,0.265,1.55),background-color .2s',
        }}
        hoverStyle={{ transform: 'scale(1.03)', background: '#FCE7E5' }}
      >
        Log out
      </Hoverable>
    </div>
  )
}

export default Profile
