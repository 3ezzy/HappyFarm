import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'

const Layout = () => {
  return (
    <div className="hf-leaf-bg relative min-h-screen bg-pageBg">
      <div className="relative">
        <Header />
        <main className="relative mx-auto max-w-[1152px] px-6 pb-[72px] pt-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
