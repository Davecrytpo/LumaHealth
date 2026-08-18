import { Router } from 'express'
import {
  bookAppointmentSchema,
  patientProfileUpdateSchema,
  updateAppointmentSchema,
} from '../../shared/schemas.js'
import { db, uid } from '../store.js'
import {
  generateSlots,
  getDoctorProfile,
  getUser,
  notify,
  toAppointmentView,
  toClinicianCard,
  toPrescriptionView,
  weekdayLabel,
  writeAudit,
} from '../lib.js'
import { asyncHandler, authRequired, requireRole, type AuthedRequest } from '../middleware.js'

export const patientRouter = Router()
patientRouter.use(authRequired, requireRole('patient'))

function patientOr404(req: AuthedRequest) {
  return db.patients.find((p) => p.userId === req.userId)
}

patientRouter.get('/overview', (req: AuthedRequest, res) => {
  const user = getUser(req.userId!)
  if (!user) {
    res.status(404).json({ message: 'We could not find your profile.' })
    return
  }
  const upcoming = db.appointments
    .filter(
      (a) =>
        a.patientId === user.id &&
        (a.status === 'confirmed' || a.status === 'pending') &&
        a.startsAt >= '2026-08-18T00:00:00.000Z',
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const nextAppointment = upcoming[0] ? toAppointmentView(upcoming[0].id) : null
  const rx = db.prescriptions.find((p) => p.patientId === user.id && p.status === 'active')
  const careSignal = rx
    ? {
        title: 'Prescription refill',
        body: `${rx.medication} has ${rx.refills} refill${rx.refills === 1 ? '' : 's'} remaining.`,
        href: `/patient/prescriptions/${rx.id}`,
      }
    : null

  const week: {
    date: string
    label: string
    weekday: string
    slots: { time: string; appointmentId?: string }[]
  }[] = []
  for (let i = 0; i < 5; i++) {
    const d = new Date(Date.UTC(2026, 7, 17 + i))
    const date = d.toISOString().slice(0, 10)
    const dayApts = upcoming.filter((a) => a.startsAt.startsWith(date))
    week.push({
      date,
      label: String(d.getUTCDate()),
      weekday: weekdayLabel(d.toISOString()).toUpperCase(),
      slots: dayApts.map((a) => ({
        time: a.startsAt.slice(11, 16),
        appointmentId: a.id,
      })),
    })
  }

  const activity = db.notifications
    .filter((n) => n.userId === user.id)
    .slice(0, 6)

  res.json({
    greetingName: user.firstName,
    nextAppointment,
    careSignal,
    week,
    activity,
  })
})

patientRouter.get('/appointments', (req: AuthedRequest, res) => {
  const tab = String(req.query.tab ?? 'upcoming')
  const items = db.appointments
    .filter((a) => a.patientId === req.userId)
    .filter((a) => {
      if (tab === 'past') return a.status === 'completed'
      if (tab === 'cancelled') return a.status === 'cancelled'
      return a.status === 'confirmed' || a.status === 'pending'
    })
    .sort((a, b) =>
      tab === 'past' || tab === 'cancelled'
        ? b.startsAt.localeCompare(a.startsAt)
        : a.startsAt.localeCompare(b.startsAt),
    )
    .map((a) => toAppointmentView(a.id))
    .filter((a) => a !== null)
  res.json({ items })
})

patientRouter.get('/appointments/:id', (req: AuthedRequest, res) => {
  const view = toAppointmentView(String(req.params.id))
  if (!view || view.patientId !== req.userId) {
    res.status(404).json({ message: 'We could not find that appointment.' })
    return
  }
  res.json(view)
})

patientRouter.post(
  '/appointments',
  asyncHandler(async (req: AuthedRequest, res) => {
    const parsed = bookAppointmentSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Check the booking details.' })
      return
    }
    const doctor = getUser(parsed.data.doctorId)
    const profile = getDoctorProfile(parsed.data.doctorId)
    if (!doctor || !profile || doctor.role !== 'clinician') {
      res.status(404).json({ message: 'We could not find that clinician.' })
      return
    }
    if (!profile.consultationTypes.includes(parsed.data.type)) {
      res.status(400).json({ message: 'That clinician does not offer this kind of visit.' })
      return
    }
    const open = generateSlots(doctor.id, '2026-08-18T00:00:00.000Z', 21).find(
      (s) => s.startsAt === parsed.data.startsAt && s.available,
    )
    if (!open) {
      res.status(409).json({ message: 'That time is no longer available.' })
      return
    }
    const appointment = {
      id: uid('apt'),
      patientId: req.userId!,
      doctorId: doctor.id,
      startsAt: open.startsAt,
      endsAt: open.endsAt,
      type: parsed.data.type,
      reason: parsed.data.reason.trim(),
      status: 'confirmed' as const,
      createdAt: new Date().toISOString(),
    }
    db.appointments.push(appointment)
    writeAudit(req.userId!, `booked an appointment with Dr. ${doctor.lastName}`)
    notify(
      req.userId!,
      'appointment',
      'Appointment confirmed',
      `Your visit with Dr. ${doctor.lastName} is on the calendar.`,
    )
    notify(
      doctor.id,
      'appointment',
      'New appointment',
      `${getUser(req.userId!)?.firstName} ${getUser(req.userId!)?.lastName} booked a visit.`,
    )
    res.status(201).json(toAppointmentView(appointment.id))
  }),
)

patientRouter.patch('/appointments/:id', (req: AuthedRequest, res) => {
  const parsed = updateAppointmentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those changes could not be saved.' })
    return
  }
  const apt = db.appointments.find((a) => a.id === req.params.id && a.patientId === req.userId)
  if (!apt) {
    res.status(404).json({ message: 'We could not find that appointment.' })
    return
  }
  if (parsed.data.status === 'cancelled') {
    apt.status = 'cancelled'
    writeAudit(req.userId!, 'cancelled an appointment')
    notify(apt.doctorId, 'appointment', 'Appointment cancelled', 'A patient cancelled a visit.')
  }
  if (parsed.data.type) apt.type = parsed.data.type
  if (parsed.data.reason) apt.reason = parsed.data.reason
  if (parsed.data.startsAt) {
    const open = generateSlots(apt.doctorId, '2026-08-18T00:00:00.000Z', 21).find(
      (s) => s.startsAt === parsed.data.startsAt && s.available,
    )
    if (!open) {
      res.status(409).json({ message: 'That time is no longer available.' })
      return
    }
    apt.startsAt = open.startsAt
    apt.endsAt = open.endsAt
    apt.status = 'confirmed'
    writeAudit(req.userId!, 'rescheduled an appointment')
  }
  res.json(toAppointmentView(apt.id))
})

patientRouter.get('/clinicians', (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? '').toLowerCase()
  const specialty = String(req.query.specialty ?? '')
  const language = String(req.query.language ?? '')
  const consultation = String(req.query.consultation ?? '')
  const availability = String(req.query.availability ?? '')
  const items = db.doctors
    .map((d) => toClinicianCard(d.userId))
    .filter((c) => c !== null)
    .filter((c) => c.verificationStatus === 'verified')
    .filter((c) => {
      if (q) {
        const hay = `${c.firstName} ${c.lastName} ${c.specialty}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (specialty && c.specialty !== specialty) return false
      if (language && !c.languages.includes(language)) return false
      if (consultation && !c.consultationTypes.includes(consultation as 'video' | 'in-person')) {
        return false
      }
      if (availability === 'this-week' && !c.nextAvailable) return false
      return true
    })
  res.json({ items })
})

patientRouter.get('/clinicians/:id', (req: AuthedRequest, res) => {
  const card = toClinicianCard(String(req.params.id))
  if (!card) {
    res.status(404).json({ message: 'We could not find that clinician.' })
    return
  }
  const slots = generateSlots(card.id, '2026-08-18T00:00:00.000Z', 14)
  res.json({ ...card, slots })
})

patientRouter.get('/prescriptions', (req: AuthedRequest, res) => {
  const items = db.prescriptions
    .filter((p) => p.patientId === req.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => toPrescriptionView(p.id))
    .filter((p) => p !== null)
  res.json({ items })
})

patientRouter.get('/prescriptions/:id', (req: AuthedRequest, res) => {
  const view = toPrescriptionView(String(req.params.id))
  if (!view || view.patientId !== req.userId) {
    res.status(404).json({ message: 'We could not find that prescription.' })
    return
  }
  res.json(view)
})

patientRouter.get('/notifications', (req: AuthedRequest, res) => {
  const items = db.notifications
    .filter((n) => n.userId === req.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ items })
})

patientRouter.post('/notifications/read-all', (req: AuthedRequest, res) => {
  db.notifications
    .filter((n) => n.userId === req.userId)
    .forEach((n) => {
      n.read = true
    })
  res.json({ ok: true })
})

patientRouter.get('/profile', (req: AuthedRequest, res) => {
  const user = getUser(req.userId!)
  const profile = patientOr404(req)
  if (!user || !profile) {
    res.status(404).json({ message: 'We could not find your profile.' })
    return
  }
  const { passwordHash: _passwordHash, ...safeUser } = user
  res.json({ user: safeUser, profile })
})

patientRouter.patch('/profile', (req: AuthedRequest, res) => {
  const parsed = patientProfileUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those profile details could not be saved.' })
    return
  }
  const user = getUser(req.userId!)
  const profile = patientOr404(req)
  if (!user || !profile) {
    res.status(404).json({ message: 'We could not find your profile.' })
    return
  }
  if (parsed.data.firstName) user.firstName = parsed.data.firstName
  if (parsed.data.lastName) user.lastName = parsed.data.lastName
  if (parsed.data.phone) profile.phone = parsed.data.phone
  if (parsed.data.address !== undefined) profile.address = parsed.data.address
  if (parsed.data.city !== undefined) profile.city = parsed.data.city
  if (parsed.data.dateOfBirth) profile.dateOfBirth = parsed.data.dateOfBirth
  if (parsed.data.sex !== undefined) profile.sex = parsed.data.sex
  if (parsed.data.preferredLanguage) profile.preferredLanguage = parsed.data.preferredLanguage
  if (parsed.data.emergencyContact) profile.emergencyContact = parsed.data.emergencyContact
  const { passwordHash: _passwordHash, ...safeUser } = user
  res.json({ user: safeUser, profile })
})
