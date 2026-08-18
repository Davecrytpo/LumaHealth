import { Link } from 'react-router-dom'

export function PublicFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-page flex-col gap-5 px-4 py-8 md:flex-row md:items-end md:justify-between md:px-8 md:py-10">
        <div>
          <p className="text-sm font-semibold">LumaHealth</p>
          <p className="mt-1 text-sm text-muted">Care, connected.</p>
        </div>
        <div className="flex gap-6 text-sm text-muted">
          <Link to="/sign-in" className="hover:text-ink">
            Sign in
          </Link>
          <Link to="/sign-up" className="hover:text-ink">
            Get started
          </Link>
          <a href="/#security" className="hover:text-ink">
            Security
          </a>
        </div>
      </div>
    </footer>
  )
}
