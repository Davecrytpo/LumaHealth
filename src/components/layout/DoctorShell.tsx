import { Outlet } from 'react-router-dom'
import { Bell, CalendarDays, House, Pill, Users } from 'lucide-react'
import { AppShell } from './AppShell'

const nav = [
  { to: '/doctor', label: 'Overview', end: true, icon: House },
  { to: '/doctor/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/prescriptions', label: 'Prescriptions', icon: Pill },
  { to: '/doctor/notifications', label: 'Notifications', icon: Bell },
  { to: '/doctor/profile', label: 'Profile', icon: Users },
  { to: '/doctor/availability', label: 'Availability', icon: CalendarDays },
]

const mobile = [
  { to: '/doctor', label: 'Overview', end: true, icon: House },
  { to: '/doctor/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/doctor/patients', label: 'Patients', icon: Users },
  { to: '/doctor/prescriptions', label: 'Rx', icon: Pill },
  { to: '/doctor/notifications', label: 'Updates', icon: Bell },
]

export function DoctorShell() {
  return (
    <AppShell nav={nav} mobileNav={mobile}>
      <Outlet />
    </AppShell>
  )
}
