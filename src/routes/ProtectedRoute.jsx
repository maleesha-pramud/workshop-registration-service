import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { PageLoader } from '../components/ui'
import ForbiddenPage from '../pages/ForbiddenPage'

/** Requires a signed-in user and, optionally, a permission. */
export default function ProtectedRoute({ permission }) {
  const { status, can } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <PageLoader />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location }} />
  if (permission && !can(permission)) return <ForbiddenPage />
  return <Outlet />
}
