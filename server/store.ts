import type {
  Appointment,
  AppNotification,
  AuditEntry,
  AvailabilityWindow,
  CareNote,
  DoctorProfile,
  PatientProfile,
  Prescription,
  PublicUser,
  Role,
} from '../shared/types.js'

export interface StoredUser extends PublicUser {
  passwordHash: string
  appearance: 'system' | 'light' | 'dark'
}

export interface Database {
  users: StoredUser[]
  patients: PatientProfile[]
  doctors: DoctorProfile[]
  availability: AvailabilityWindow[]
  appointments: Appointment[]
  prescriptions: Prescription[]
  notifications: AppNotification[]
  audit: AuditEntry[]
  notes: CareNote[]
  passwordResets: { email: string; sentAt: string }[]
}

export const db: Database = {
  users: [],
  patients: [],
  doctors: [],
  availability: [],
  appointments: [],
  prescriptions: [],
  notifications: [],
  audit: [],
  notes: [],
  passwordResets: [],
}

export const sessions = new Map<string, { userId: string; role: Role }>()

export function resetDatabase(seed: Database) {
  db.users = [...seed.users]
  db.patients = [...seed.patients]
  db.doctors = [...seed.doctors]
  db.availability = [...seed.availability]
  db.appointments = [...seed.appointments]
  db.prescriptions = [...seed.prescriptions]
  db.notifications = [...seed.notifications]
  db.audit = [...seed.audit]
  db.notes = [...seed.notes]
  db.passwordResets = [...seed.passwordResets]
  sessions.clear()
}

export function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}
