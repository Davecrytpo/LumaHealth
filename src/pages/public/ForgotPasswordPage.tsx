import { useState } from 'react'
import { Link } from 'react-router-dom'
import { json } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ApiError } from '@/lib/api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await json.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not send that link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 md:px-8 md:py-12">
      <Link to="/" className="text-sm font-semibold">
        LumaHealth
      </Link>
      <div className="mx-auto mt-24 max-w-md">
        {sent ? (
          <div>
            <h1 className="lh-display">Check your inbox.</h1>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              We’ve sent instructions to reset your password.
            </p>
            <Link to="/sign-in" className="mt-8 inline-block text-sm text-ink hover:underline">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <h1 className="lh-display">Let’s get you back in.</h1>
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error ? (
              <p className="text-sm text-terracotta" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" loading={loading}>
              Send reset link
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
