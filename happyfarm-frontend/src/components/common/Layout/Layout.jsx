import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import { C } from '../../../theme/hf.jsx'

const Layout = () => {
  return (
    <div className="hf-leaf-bg" style={{ minHeight: '100vh', position: 'relative', background: C.pageBg }}>
      <div style={{ position: 'relative' }}>
        <Header />
        <main style={{ maxWidth: '1152px', margin: '0 auto', padding: '36px 24px 72px', position: 'relative' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
