import { Outlet } from 'react-router-dom'
import Topbar from './Topbar.jsx'
import Sidebar from './Sidebar.jsx'

const Layout = () => {
  return (
    <div className="min-h-screen bg-surface-page">
      <Topbar />
      <Sidebar />
      <main className="relative mx-auto max-w-content px-4 pb-24 pt-24 nav:ps-sidebar nav:pb-9 nav:pt-24 nav:pe-6">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
