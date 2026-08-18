import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Bell } from 'lucide-react'
import { homeForRole, useAuth } from '@/context/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/cn'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function AppShell({
  nav,
  mobileNav,
  footerNav,
  children,
}: {
  nav: NavItem[]
  mobileNav: NavItem[]
  footerNav?: NavItem[]
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)
  const name = user ? `${user.firstName} ${user.lastName}` : ''
  const home = user ? homeForRole(user.role) : '/'
  const notifyTo =
    user?.role === 'clinician'
      ? '/doctor/notifications'
      : user?.role === 'admin'
        ? '/admin/audit-log'
        : '/patient/notifications'
  const accountLinks =
    user?.role === 'clinician'
      ? [
          { to: '/doctor/profile', label: 'Profile' },
          { to: '/doctor/availability', label: 'Availability' },
        ]
      : user?.role === 'admin'
        ? [{ to: '/admin/settings', label: 'System' }]
        : [
            { to: '/patient/profile', label: 'Profile' },
            { to: '/patient/settings', label: 'Settings' },
          ]

  function leave() {
    setAccountOpen(false)
    void signOut().then(() => navigate('/sign-in'))
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          <NavLink to={home} className="text-sm font-semibold tracking-tight">
            LumaHealth
          </NavLink>
          <div className="flex items-center gap-1">
            <NavLink
              to={notifyTo}
              className="inline-flex min-h-11 min-w-11 items-center justify-center text-muted hover:text-ink"
              aria-label={user?.role === 'admin' ? 'Audit log' : 'Notifications'}
            >
              <span className="hidden text-sm md:inline">{user?.role === 'admin' ? 'Audit log' : 'Notifications'}</span>
              <Bell className="md:hidden" size={20} strokeWidth={1.6} aria-hidden />
            </NavLink>
            <div className="relative md:hidden">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center"
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                aria-label="Account"
                onClick={() => setAccountOpen((v) => !v)}
              >
                <Avatar name={name} size="sm" />
              </button>
            </div>
          </div>
        </div>
        {accountOpen ? (
          <div id="account-menu" className="border-t border-line bg-surface px-4 py-3 md:hidden">
            <p className="text-sm text-ink">{name}</p>
            <p className="text-xs capitalize text-muted">{user?.role === 'clinician' ? 'Clinician' : user?.role}</p>
            <div className="mt-3 grid gap-1">
              {accountLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="block py-2.5 text-sm text-ink"
                  onClick={() => setAccountOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <button type="button" className="block py-2.5 text-left text-sm text-muted" onClick={leave}>
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <div className="mx-auto flex min-h-[calc(100vh-53px)] max-w-[1440px]">
        <aside className="hidden w-56 shrink-0 border-r border-line md:flex md:flex-col">
          <nav className="flex flex-1 flex-col gap-1 px-3 py-6" aria-label="Portal">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-lh px-3 py-2 text-sm',
                    isActive ? 'bg-surface text-ink' : 'text-muted hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {footerNav?.length ? (
            <nav className="px-3 pb-3" aria-label="Help">
              {footerNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn('block rounded-lh px-3 py-2 text-sm', isActive ? 'text-ink' : 'text-muted hover:text-ink')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : null}
          <div className="border-t border-line px-4 py-4">
            <NavLink
              to={
                user?.role === 'clinician'
                  ? '/doctor/profile'
                  : user?.role === 'admin'
                    ? '/admin/settings'
                    : '/patient/profile'
              }
              className="flex items-center gap-3"
            >
              <Avatar name={name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm text-ink">{name}</p>
                <p className="text-xs capitalize text-muted">{user?.role === 'clinician' ? 'Clinician' : user?.role}</p>
              </div>
            </NavLink>
            <button type="button" className="mt-3 text-xs text-muted hover:text-ink" onClick={leave}>
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Mobile"
      >
        <ul className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex min-h-[3.5rem] flex-col items-center justify-center gap-1 px-1 text-[11px] leading-none',
                      isActive ? 'text-ink' : 'text-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn('h-0.5 w-4 rounded-full', isActive ? 'bg-terracotta' : 'bg-transparent')} />
                      <Icon size={20} strokeWidth={isActive ? 1.9 : 1.6} aria-hidden />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
