import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-canvas px-6 py-16">
      <Link to="/" className="text-sm font-semibold">
        LumaHealth
      </Link>
      <div className="mx-auto mt-24 max-w-lg">
        <p className="lh-kicker">404</p>
        <h1 className="mt-4 font-display text-5xl">This page isn’t here.</h1>
        <p className="mt-4 text-sm text-muted">The address may have changed, or it never existed.</p>
        <div className="mt-8">
          <Link to="/">
            <Button>Back to LumaHealth</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
