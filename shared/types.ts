export type Role = 'patient' | 'clinician' | 'admin'

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled'
export type ConsultationType = 'video' | 'in-person'
export type PrescriptionStatus = 'active' | 'expired' | 'cancelled'
export type VerificationStatus = 'verified' | 'pending' | 'rejected'
export type UserStatus = 'active' | 'invited' | 'suspended'
export type Appearance = 'system' | 'light' | 'dark'
export type NotificationKind =
  | 'appointment'
  | 'prescription'
  | 'care-team'
  | 'system'

export interface PublicUser {
  id: string
  email: string
  role: Role
  firstName: string
  lastName: string
  status: UserStatus
  createdAt: string
  lastActiveAt: string
}

export interface SessionUser extends PublicUser {
  appearance: Appearance
}

export interface EmergencyContact {
  name: string
  relationship: string
  phone: string
}

export interface NotificationPrefs {
  appointmentReminders: boolean
  prescriptionUpdates: boolean
  careTeamMessages: boolean
}

export interface PatientProfile {
  userId: string
  dateOfBirth: string
  sex: string
  phone: string
  address: string
  city: string
  emergencyContact: EmergencyContact
  preferredLanguage: string
  notifications: NotificationPrefs
}

export interface DoctorProfile {
  userId: string
  title: string
  specialty: string
  bio: string
  yearsExperience: number
  languages: string[]
  consultationTypes: ConsultationType[]
  verificationStatus: VerificationStatus
}

export interface AvailabilityWindow {
  id: string
  doctorId: string
  dayOfWeek: number
  start: string
  end: string
}

export interface TimeSlot {
  startsAt: string
  endsAt: string
  available: boolean
}

export interface Appointment {
  id: string
  patientId: string
  doctorId: string
  startsAt: string
  endsAt: string
  type: ConsultationType
  reason: string
  status: AppointmentStatus
  createdAt: string
}

export interface AppointmentView extends Appointment {
  patient: Pick<PublicUser, 'id' | 'firstName' | 'lastName'>
  doctor: Pick<PublicUser, 'id' | 'firstName' | 'lastName'> & {
    specialty: string
  }
}

export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  medication: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string
  refills: number
  instructions: string
  status: PrescriptionStatus
  createdAt: string
}

export interface PrescriptionView extends Prescription {
  patient: Pick<PublicUser, 'id' | 'firstName' | 'lastName'>
  doctor: Pick<PublicUser, 'id' | 'firstName' | 'lastName'> & {
    specialty: string
  }
}

export interface AppNotification {
  id: string
  userId: string
  kind: NotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
}

export interface AuditEntry {
  id: string
  actorId: string
  actorName: string
  action: string
  createdAt: string
}

export interface CareNote {
  id: string
  patientId: string
  doctorId: string
  body: string
  createdAt: string
}

export interface ClinicianCard {
  id: string
  firstName: string
  lastName: string
  specialty: string
  yearsExperience: number
  languages: string[]
  consultationTypes: ConsultationType[]
  nextAvailable: string | null
  bio: string
  verificationStatus: VerificationStatus
}

export interface WeekDay {
  date: string
  label: string
  weekday: string
  slots: { time: string; appointmentId?: string }[]
}

export interface PatientOverview {
  greetingName: string
  nextAppointment: AppointmentView | null
  careSignal: {
    title: string
    body: string
    href: string
  } | null
  week: WeekDay[]
  activity: AppNotification[]
}

export interface DoctorOverview {
  greetingName: string
  todayCount: number
  pendingCount: number
  followUpCount: number
  today: AppointmentView[]
}

export interface AdminOverview {
  activePatients: number
  clinicians: number
  appointmentsToday: number
  pendingActions: number
  activity: AuditEntry[]
}

export interface SignInPayload {
  email: string
  password: string
}

export interface SignUpPayload {
  role: 'patient' | 'clinician'
  firstName: string
  lastName: string
  dateOfBirth?: string
  sex?: string
  email: string
  phone: string
  password: string
  preferredLanguage?: string
  specialty?: string
  appearance: Appearance
}

export interface ForgotPasswordPayload {
  email: string
}

export interface AuthResponse {
  token: string
  user: SessionUser
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ApiErrorBody {
  message: string
  code?: string
}
