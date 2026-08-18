import { Outlet } from 'react-router-dom'
import { CalendarDays, House, ScrollText, Settings, Stethoscope, Users } from 'lucide-react'
import { AppShell } from './AppShell'

const nav = [
  { to: '/admin', label: 'Overview', end: true, icon: House },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/admin/audit-log', label: 'Audit log', icon: ScrollText },
  { to: '/admin/settings', label: 'System', icon: Settings },
]

const mobile = [
  { to: '/admin', label: 'Overview', end: true, icon: House },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/doctors', label: 'Doctors', icon: Stethoscope },
  { to: '/admin/appointments', label: 'Visits', icon: CalendarDays },
  { to: '/admin/audit-log', label: 'Audit', icon: ScrollText },
]

export function AdminShell() {
  return (
    <AppShell nav={nav} mobileNav={mobile}>
      <Outlet />
    </AppShell>
  )
}
