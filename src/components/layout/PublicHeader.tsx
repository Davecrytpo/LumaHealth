import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

const links = [
  { href: '/#patients', label: 'For Patients' },
  { href: '/#clinicians', label: 'For Clinicians' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#security', label: 'Security' },
]

export function PublicHeader({ solid = false }: { solid?: boolean }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const warm = solid || scrolled || open

  return (
    <header
      className={cn(
        'sticky top-0 z-30 transition-colors',
        warm ? 'border-b border-line bg-surface' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex max-w-page items-center justify-between gap-4 px-4 py-3.5 md:px-8 md:py-4">
        <Link to="/" className="font-sans text-sm font-semibold tracking-tight text-ink">
          LumaHealth
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted lg:flex" aria-label="Primary">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <NavLink to="/sign-in" className="text-sm text-ink">
            Sign in
          </NavLink>
          <NavLink
            to="/sign-up"
            className="hidden rounded-lh bg-[var(--lh-btn)] px-3.5 py-2 text-sm text-[var(--lh-btn-fg)] hover:opacity-90 md:inline"
          >
            Get started
          </NavLink>
          <button
            type="button"
            className="min-h-11 min-w-11 rounded-lh border border-line px-3 text-sm text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="public-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="public-menu" className="border-t border-line bg-surface px-4 py-5 lg:hidden" aria-label="Sections">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="block py-3 text-base text-ink"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-5">
            <NavLink
              to="/sign-in"
              className="rounded-lh border border-line px-3 py-3 text-center text-sm"
              onClick={() => setOpen(false)}
            >
              Sign in
            </NavLink>
            <NavLink
              to="/sign-up"
              className="rounded-lh bg-[var(--lh-btn)] px-3 py-3 text-center text-sm text-[var(--lh-btn-fg)]"
              onClick={() => setOpen(false)}
            >
              Get started
            </NavLink>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
