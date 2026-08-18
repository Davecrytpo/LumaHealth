import { Navigate, useLocation } from 'react-router-dom'
import type { Role } from '@shared/types'
import { useAuth, homeForRole } from '@/context/AuthContext'
import { Skeleton } from '@/components/ui/Skeleton'

export function ProtectedRoute({
  roles,
  children,
}: {
  roles: Role[]
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="lh-page space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}

export function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="lh-page">
        <Skeleton className="h-10 w-48" />
      </div>
    )
  }
  if (user) return <Navigate to={homeForRole(user.role)} replace />
  return <>{children}</>
}
