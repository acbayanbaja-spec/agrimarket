import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  children: React.ReactNode
  roles?: string[]
}

const ProtectedRoute = ({ children, roles }: Props) => {
  const { isAuthenticated, ready, hasRole } = useAuth()
  const location = useLocation()

  if (!ready) {
    return <div className="page-shell text-center text-gray-500">Loading your workspace…</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.some((role) => hasRole(role))) {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
