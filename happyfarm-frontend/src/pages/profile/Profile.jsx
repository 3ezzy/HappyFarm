import React, { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useAuth } from '../../context/AuthContext.jsx'
import { farmService } from '../../services/api/farm.js'
import { initialsOf } from '../../theme/hf.jsx'

const Toggle = ({ on, onClick }) => (
  <button
    onClick={onClick}
    className={classNames(
      'inline-flex h-[26px] w-[46px] cursor-pointer items-center rounded-full border-none p-[3px] transition-colors duration-200',
      on ? 'justify-end bg-green' : 'justify-start bg-toggleOff'
    )}
  >
    <span className="block h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
  </button>
)

const Profile = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, farm, logout } = useAuth()
  const [reminders, setReminders] = useState(true)
  const [greetings, setGreetings] = useState(true)

  const { data: farmDetails } = useQuery('farm-details', farmService.getDetails, { refetchOnWindowFocus: false })

  const createdAt = farmDetails?.created_at
  const memberSince = createdAt
    ? new Intl.DateTimeFormat(i18n.language, { month: 'long', year: 'numeric', numberingSystem: 'latn' }).format(new Date(createdAt))
    : '—'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="mx-auto max-w-[680px] animate-hf-pop">
      <h1 className="mb-[22px] text-[34px]">{t('profile.title')}</h1>

      <div className="mb-6 rounded-2xl bg-cream p-7 shadow-ribbon">
        <div className="flex items-center gap-[18px]">
          <span className="inline-flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green font-display text-[26px] font-bold text-white shadow-ribbon">
            {initialsOf(user?.name)}
          </span>
          <div>
            <h2 className="text-[26px]">{user?.name}</h2>
            <p className="mt-1 text-tan">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3.5 xs:grid-cols-2">
          <div className="rounded-2xl bg-green-soft p-4">
            <p className="text-[13px] font-medium text-tan">{t('profile.farm')}</p>
            <p className="mt-[3px] font-display text-base font-bold text-brown-text">{farm?.name}</p>
          </div>
          <div className="rounded-2xl bg-green-soft p-4">
            <p className="text-[13px] font-medium text-tan">{t('profile.memberSince')}</p>
            <p className="mt-[3px] font-display text-base font-bold text-brown-text">{memberSince}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl bg-cream p-6 shadow-ribbon">
        <h2 className="mb-4 text-[22px]">{t('profile.preferences')}</h2>
        <div className="flex items-center justify-between border-b border-cream-muted py-2.5">
          <span className="text-[15px] text-brown">{t('profile.careReminders')}</span>
          <Toggle on={reminders} onClick={() => setReminders((v) => !v)} />
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-[15px] text-brown">{t('profile.eidGreetings')}</span>
          <Toggle on={greetings} onClick={() => setGreetings((v) => !v)} />
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-red-line bg-cream px-6 py-3 font-display text-[15px] font-bold text-red-dark transition-all duration-200 ease-pop hover:scale-[1.03] hover:bg-red-soft"
      >
        {t('profile.logOut')}
      </button>
    </div>
  )
}

export default Profile
