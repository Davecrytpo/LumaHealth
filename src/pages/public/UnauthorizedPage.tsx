import { Link } from 'react-router-dom'
import { useAuth, homeForRole } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'

export function UnauthorizedPage() {
  const { user } = useAuth()
  const home = user ? homeForRole(user.role) : '/sign-in'
  return (
    <div className="min-h-screen bg-canvas px-6 py-16">
      <Link to="/" className="text-sm font-semibold">
        LumaHealth
      </Link>
      <div className="mx-auto mt-24 max-w-lg">
        <h1 className="font-display text-5xl">This area isn’t for this account.</h1>
        <p className="mt-4 text-sm text-muted">You can go back to the space that belongs to you.</p>
        <div className="mt-8">
          <Link to={home}>
            <Button>Take me there</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
