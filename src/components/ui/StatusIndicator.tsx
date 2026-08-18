import { Badge } from './Badge'
import type { AppointmentStatus, PrescriptionStatus, VerificationStatus, UserStatus } from '@shared/types'

const appointmentCopy: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function AppointmentStatus({ status }: { status: AppointmentStatus }) {
  return <Badge label={appointmentCopy[status]} tone={status} />
}

export function PrescriptionStatusBadge({ status }: { status: PrescriptionStatus }) {
  return <Badge label={status} tone={status === 'active' ? 'active' : status === 'cancelled' ? 'cancelled' : 'completed'} />
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <Badge label={status} tone={status === 'verified' ? 'verified' : status === 'rejected' ? 'rejected' : 'pending'} />
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return <Badge label={status} tone={status === 'active' ? 'active' : status === 'suspended' ? 'suspended' : 'invited'} />
}
