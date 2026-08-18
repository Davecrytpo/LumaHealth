import { Outlet } from 'react-router-dom'
import { Bell, CalendarDays, CircleHelp, House, Pill, Search, UserRound } from 'lucide-react'
import { AppShell } from './AppShell'

const nav = [
  { to: '/patient', label: 'Overview', end: true, icon: House },
  { to: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/patient/find-care', label: 'Find Care', icon: Search },
  { to: '/patient/prescriptions', label: 'Prescriptions', icon: Pill },
  { to: '/patient/notifications', label: 'Notifications', icon: Bell },
  { to: '/patient/profile', label: 'Profile', icon: UserRound },
]

const footerNav = [{ to: '/patient/settings', label: 'Settings', icon: CircleHelp }]

const mobile = [
  { to: '/patient', label: 'Overview', end: true, icon: House },
  { to: '/patient/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/patient/find-care', label: 'Find Care', icon: Search },
  { to: '/patient/notifications', label: 'Updates', icon: Bell },
  { to: '/patient/profile', label: 'Profile', icon: UserRound },
]

export function PatientShell() {
  return (
    <AppShell nav={nav} mobileNav={mobile} footerNav={footerNav}>
      <Outlet />
    </AppShell>
  )
}
