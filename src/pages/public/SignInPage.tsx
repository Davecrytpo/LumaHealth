import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, homeForRole } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@shared/constants'

export function SignInPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await signIn({ email, password })
      navigate(from ?? homeForRole(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not sign you in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <section className="flex flex-col justify-between px-4 py-6 md:px-14 md:py-10">
        <Link to="/" className="text-sm font-semibold">
          LumaHealth
        </Link>
        <div className="max-w-md py-8 md:py-16">
          <h1 className="lh-display-lg">Welcome back.</h1>
          <p className="mt-3 text-sm text-muted md:mt-5 md:text-base">Your care is waiting when you are.</p>
        </div>
        <p className="hidden text-xs text-muted lg:block">
          Demo · {DEMO_ACCOUNTS.patient.email} · {DEMO_PASSWORD}
        </p>
      </section>
      <section className="flex items-start bg-surface px-4 py-8 md:items-center md:px-14 md:py-16 lg:border-l lg:border-t-0">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-sm space-y-5">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error ? (
            <p className="text-sm text-terracotta" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
          <div className="flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-muted hover:text-ink">
              Forgot password?
            </Link>
          </div>
          <p className="pt-4 text-sm text-muted">
            Don’t have an account?{' '}
            <Link to="/sign-up" className="text-ink underline-offset-4 hover:underline">
              Create one
            </Link>
          </p>
          <p className="pt-2 text-xs text-muted lg:hidden">
            Demo · {DEMO_ACCOUNTS.patient.email} · {DEMO_PASSWORD}
          </p>
        </form>
      </section>
    </div>
  )
}
