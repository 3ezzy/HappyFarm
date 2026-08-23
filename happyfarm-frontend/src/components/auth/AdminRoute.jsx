import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

/**
 * Sits inside ProtectedRoute (so auth/isLoading are already handled) and
 * adds the role check. Silent redirect on failure, same as ProtectedRoute
 * itself — no special "not authorized" messaging, since the backend
 * (EnsureUserIsAdmin) is what actually enforces this; this is just so a
 * non-admin doesn't see the page flash before any API call 403s.
 */
const AdminRoute = () => {
  const { user } = useAuth()

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default AdminRoute
