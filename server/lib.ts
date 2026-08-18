import type {
  AppointmentView,
  ClinicianCard,
  PrescriptionView,
  PublicUser,
  SessionUser,
} from '../shared/types.js'
import { db, type StoredUser } from './store.js'

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
  }
}

export function toSessionUser(user: StoredUser): SessionUser {
  return { ...toPublicUser(user), appearance: user.appearance }
}

export function displayName(user: Pick<PublicUser, 'firstName' | 'lastName'>, titled = false) {
  const name = `${user.firstName} ${user.lastName}`.trim()
  return titled ? `Dr. ${user.lastName}` : name
}

export function getUser(id: string) {
  return db.users.find((u) => u.id === id)
}

export function getDoctorProfile(id: string) {
  return db.doctors.find((d) => d.userId === id)
}

export function toAppointmentView(id: string): AppointmentView | null {
  const apt = db.appointments.find((a) => a.id === id)
  if (!apt) return null
  const patient = getUser(apt.patientId)
  const doctor = getUser(apt.doctorId)
  const profile = getDoctorProfile(apt.doctorId)
  if (!patient || !doctor || !profile) return null
  return {
    ...apt,
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
    },
    doctor: {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialty: profile.specialty,
    },
  }
}

export function toPrescriptionView(id: string): PrescriptionView | null {
  const rx = db.prescriptions.find((p) => p.id === id)
  if (!rx) return null
  const patient = getUser(rx.patientId)
  const doctor = getUser(rx.doctorId)
  const profile = getDoctorProfile(rx.doctorId)
  if (!patient || !doctor || !profile) return null
  return {
    ...rx,
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
    },
    doctor: {
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialty: profile.specialty,
    },
  }
}

export function toClinicianCard(doctorId: string): ClinicianCard | null {
  const user = getUser(doctorId)
  const profile = getDoctorProfile(doctorId)
  if (!user || !profile) return null
  const next = nextOpenSlot(doctorId)
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    specialty: profile.specialty,
    yearsExperience: profile.yearsExperience,
    languages: profile.languages,
    consultationTypes: profile.consultationTypes,
    nextAvailable: next,
    bio: profile.bio,
    verificationStatus: profile.verificationStatus,
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

export function slotKey(iso: string) {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:00.000Z`
}

export function generateSlots(doctorId: string, fromIso: string, days: number) {
  const windows = db.availability.filter((w) => w.doctorId === doctorId)
  const booked = new Set(
    db.appointments
      .filter(
        (a) =>
          a.doctorId === doctorId &&
          (a.status === 'confirmed' || a.status === 'pending'),
      )
      .map((a) => a.startsAt),
  )
  const start = new Date(fromIso)
  start.setUTCHours(0, 0, 0, 0)
  const slots: { startsAt: string; endsAt: string; available: boolean }[] = []

  for (let i = 0; i < days; i++) {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + i)
    const dow = day.getUTCDay()
    for (const window of windows.filter((w) => w.dayOfWeek === dow)) {
      const [sh, sm] = window.start.split(':').map(Number)
      const [eh, em] = window.end.split(':').map(Number)
      let cursor = new Date(day)
      cursor.setUTCHours(sh ?? 0, sm ?? 0, 0, 0)
      const end = new Date(day)
      end.setUTCHours(eh ?? 0, em ?? 0, 0, 0)
      while (cursor < end) {
        const startsAt = cursor.toISOString()
        const endsAt = addMinutes(startsAt, 30)
        if (new Date(endsAt) <= end) {
          slots.push({
            startsAt,
            endsAt,
            available: !booked.has(startsAt) && startsAt > '2026-08-18T08:00:00.000Z',
          })
        }
        cursor = new Date(cursor.getTime() + 30 * 60_000)
      }
    }
  }
  return slots
}

export function nextOpenSlot(doctorId: string) {
  return (
    generateSlots(doctorId, '2026-08-18T00:00:00.000Z', 14).find((s) => s.available)
      ?.startsAt ?? null
  )
}

export function writeAudit(actorId: string, action: string) {
  const actor = getUser(actorId)
  db.audit.unshift({
    id: `au_${Date.now().toString(36)}`,
    actorId,
    actorName: actor
      ? actor.role === 'clinician'
        ? `Dr. ${actor.lastName}`
        : `${actor.firstName} ${actor.lastName}`
      : 'System',
    action,
    createdAt: new Date().toISOString(),
  })
}

export function notify(
  userId: string,
  kind: 'appointment' | 'prescription' | 'care-team' | 'system',
  title: string,
  body: string,
) {
  const patient = db.patients.find((p) => p.userId === userId)
  if (patient) {
    if (kind === 'appointment' && !patient.notifications.appointmentReminders) return
    if (kind === 'prescription' && !patient.notifications.prescriptionUpdates) return
    if (kind === 'care-team' && !patient.notifications.careTeamMessages) return
  }
  db.notifications.unshift({
    id: `nt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    userId,
    kind,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  })
}

export function ageFromDob(dob: string, on = '2026-08-18') {
  const birth = new Date(dob)
  const now = new Date(on)
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const m = now.getUTCMonth() - birth.getUTCMonth()
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) age -= 1
  return age
}

export function weekdayLabel(iso: string) {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(iso).getUTCDay()] ?? ''
}
