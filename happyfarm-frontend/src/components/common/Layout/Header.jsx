import React from 'react'
import classNames from 'classnames'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext.jsx'
import { C, LeafMark, initialsOf, btnCream } from '../../../theme/hf.jsx'

const NavButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={classNames(
      'cursor-pointer whitespace-nowrap border-none bg-transparent p-0',
      'font-display text-base font-bold text-brown-text',
      active && '-translate-y-px'
    )}
  >
    {label}
    {active && <span className="mt-[3px] block h-0.5 rounded-sm bg-brown-text" />}
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
    <div className="relative">
      {/* Eid utility strip */}
      <div className="bg-red px-4 py-1.5 text-center text-[12.5px] font-medium tracking-[.3px] text-white">
        🌙 Eid Al Adha — may your sacrifice be accepted · تقبل الله
      </div>

      {/* Green ribbon nav */}
      <header className="hf-leaf-bg-header relative bg-green px-4 pb-[30px] pt-[18px]">
        <div className="hf-scallop absolute inset-x-0 bottom-0 h-3" />

        <div className="relative mx-auto flex max-w-[1152px] flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex cursor-pointer items-center gap-[9px] border-none bg-transparent"
          >
            <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-cream shadow-mark">
              <LeafMark size={22} color={C.green} />
            </span>
            <span className="font-display text-[21px] font-bold text-cream">HappyFarm</span>
          </button>

          {/* yellow ribbon */}
          <nav className="hf-ribbon bg-yellow px-[30px] py-[11px] shadow-ribbon">
            <div className="flex items-center gap-[26px]">
              <NavButton label="Home" active={isDashboard} onClick={() => navigate('/')} />
              <NavButton label="Animals" active={isAnimals} onClick={() => navigate('/animals')} />
              <NavButton label="Farm" active={isFarm} onClick={() => navigate('/farm')} />
              <NavButton label="Profile" active={isProfile} onClick={() => navigate('/profile')} />
            </div>
          </nav>

          <div className="flex items-center gap-2.5">
            <button onClick={() => navigate('/animals/add')} className={classNames(btnCream, 'text-sm')}>
              <span className="text-base leading-none">+</span> Add
            </button>
            <button
              onClick={() => navigate('/profile')}
              title="Profile"
              className="h-[38px] w-[38px] cursor-pointer rounded-full border-none bg-green-dark font-display text-[15px] font-bold text-white shadow-mark"
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
