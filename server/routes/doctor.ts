import { Router } from 'express'
import {
  availabilityUpdateSchema,
  createPrescriptionSchema,
  doctorProfileUpdateSchema,
  updateAppointmentSchema,
} from '../../shared/schemas.js'
import { db, uid } from '../store.js'
import {
  ageFromDob,
  generateSlots,
  getUser,
  notify,
  toAppointmentView,
  toPrescriptionView,
  writeAudit,
} from '../lib.js'
import { authRequired, requireRole, type AuthedRequest } from '../middleware.js'

export const doctorRouter = Router()
doctorRouter.use(authRequired, requireRole('clinician'))

doctorRouter.get('/overview', (req: AuthedRequest, res) => {
  const user = getUser(req.userId!)
  if (!user) {
    res.status(404).json({ message: 'We could not find your profile.' })
    return
  }
  const today = db.appointments
    .filter((a) => a.doctorId === user.id && a.startsAt.startsWith('2026-08-18'))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((a) => toAppointmentView(a.id))
    .filter((a) => a !== null)
  res.json({
    greetingName: `Dr. ${user.lastName}`,
    todayCount: today.filter((a) => a.status !== 'cancelled').length,
    pendingCount: today.filter((a) => a.status === 'pending').length,
    followUpCount: today.filter((a) => /follow/i.test(a.reason)).length,
    today,
  })
})

doctorRouter.get('/schedule', (req: AuthedRequest, res) => {
  const date = String(req.query.date ?? '2026-08-18')
  const items = db.appointments
    .filter((a) => a.doctorId === req.userId && a.startsAt.startsWith(date))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((a) => toAppointmentView(a.id))
    .filter((a) => a !== null)
  const slots = generateSlots(req.userId!, `${date}T00:00:00.000Z`, 1)
  res.json({ date, items, slots })
})

doctorRouter.get('/appointments/:id', (req: AuthedRequest, res) => {
  const view = toAppointmentView(String(req.params.id))
  if (!view || view.doctorId !== req.userId) {
    res.status(404).json({ message: 'We could not find that appointment.' })
    return
  }
  const profile = db.patients.find((p) => p.userId === view.patientId)
  res.json({
    ...view,
    patientAge: profile ? ageFromDob(profile.dateOfBirth) : null,
  })
})

doctorRouter.patch('/appointments/:id', (req: AuthedRequest, res) => {
  const parsed = updateAppointmentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those changes could not be saved.' })
    return
  }
  const apt = db.appointments.find((a) => a.id === req.params.id && a.doctorId === req.userId)
  if (!apt) {
    res.status(404).json({ message: 'We could not find that appointment.' })
    return
  }
  if (parsed.data.status) {
    apt.status = parsed.data.status
    writeAudit(req.userId!, `${parsed.data.status} an appointment`)
    if (parsed.data.status === 'cancelled') {
      notify(apt.patientId, 'appointment', 'Appointment cancelled', 'Your clinician cancelled this visit.')
    }
    if (parsed.data.status === 'completed') {
      notify(apt.patientId, 'appointment', 'Visit completed', 'Your clinician marked the visit complete.')
    }
  }
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
  }
  res.json(toAppointmentView(apt.id))
})

doctorRouter.get('/patients', (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? '').toLowerCase()
  const ids = new Set(
    db.appointments.filter((a) => a.doctorId === req.userId).map((a) => a.patientId),
  )
  const items = [...ids]
    .map((id) => {
      const user = getUser(id)
      if (!user) return null
      const last = db.appointments
        .filter((a) => a.doctorId === req.userId && a.patientId === id && a.status === 'completed')
        .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0]
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        lastVisit: last?.startsAt ?? null,
      }
    })
    .filter((p) => p !== null)
    .filter((p) => {
      if (!q) return true
      return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    })
  res.json({ items })
})

doctorRouter.get('/patients/:id', (req: AuthedRequest, res) => {
  const user = getUser(String(req.params.id))
  const profile = db.patients.find((p) => p.userId === req.params.id)
  if (!user || !profile || user.role !== 'patient') {
    res.status(404).json({ message: 'We could not find that patient.' })
    return
  }
  const related = db.appointments.some((a) => a.doctorId === req.userId && a.patientId === user.id)
  if (!related) {
    res.status(403).json({ message: 'You do not have a care relationship with this person.' })
    return
  }
  const last = db.appointments
    .filter((a) => a.doctorId === req.userId && a.patientId === user.id && a.status === 'completed')
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))[0]
  res.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    profile: {
      dateOfBirth: profile.dateOfBirth,
      sex: profile.sex,
      preferredLanguage: profile.preferredLanguage,
      age: ageFromDob(profile.dateOfBirth),
    },
    lastAppointment: last ? toAppointmentView(last.id) : null,
    appointments: db.appointments
      .filter((a) => a.doctorId === req.userId && a.patientId === user.id)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
      .map((a) => toAppointmentView(a.id))
      .filter((a) => a !== null),
    prescriptions: db.prescriptions
      .filter((p) => p.doctorId === req.userId && p.patientId === user.id)
      .map((p) => toPrescriptionView(p.id))
      .filter((p) => p !== null),
    notes: db.notes.filter((n) => n.doctorId === req.userId && n.patientId === user.id),
  })
})

doctorRouter.get('/prescriptions', (req: AuthedRequest, res) => {
  const items = db.prescriptions
    .filter((p) => p.doctorId === req.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => toPrescriptionView(p.id))
    .filter((p) => p !== null)
  res.json({ items })
})

doctorRouter.post('/prescriptions', (req: AuthedRequest, res) => {
  const parsed = createPrescriptionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Check the prescription.' })
    return
  }
  const patient = getUser(parsed.data.patientId)
  if (!patient || patient.role !== 'patient') {
    res.status(404).json({ message: 'We could not find that patient.' })
    return
  }
  const related = db.appointments.some((a) => a.doctorId === req.userId && a.patientId === patient.id)
  if (!related) {
    res.status(403).json({ message: 'You do not have a care relationship with this person.' })
    return
  }
  const rx = {
    id: uid('rx'),
    patientId: patient.id,
    doctorId: req.userId!,
    medication: parsed.data.medication.trim(),
    dosage: parsed.data.dosage.trim(),
    frequency: parsed.data.frequency.trim(),
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    refills: parsed.data.refills,
    instructions: parsed.data.instructions.trim(),
    status: 'active' as const,
    createdAt: new Date().toISOString(),
  }
  db.prescriptions.push(rx)
  writeAudit(req.userId!, `created a prescription for ${patient.firstName} ${patient.lastName}`)
  notify(
    patient.id,
    'prescription',
    'New prescription',
    `${rx.medication} is now on your list.`,
  )
  res.status(201).json(toPrescriptionView(rx.id))
})

doctorRouter.get('/profile', (req: AuthedRequest, res) => {
  const user = getUser(req.userId!)
  const profile = db.doctors.find((d) => d.userId === req.userId)
  if (!user || !profile) {
    res.status(404).json({ message: 'We could not find your profile.' })
    return
  }
  res.json({
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
    profile,
  })
})

doctorRouter.patch('/profile', (req: AuthedRequest, res) => {
  const parsed = doctorProfileUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those profile details could not be saved.' })
    return
  }
  const profile = db.doctors.find((d) => d.userId === req.userId)
  if (!profile) {
    res.status(404).json({ message: 'We could not find your profile.' })
    return
  }
  Object.assign(profile, parsed.data)
  res.json({ profile })
})

doctorRouter.get('/availability', (req: AuthedRequest, res) => {
  const windows = db.availability
    .filter((w) => w.doctorId === req.userId)
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.start.localeCompare(b.start))
  res.json({ windows })
})

doctorRouter.put('/availability', (req: AuthedRequest, res) => {
  const parsed = availabilityUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those hours could not be saved.' })
    return
  }
  db.availability = db.availability.filter((w) => w.doctorId !== req.userId)
  const windows = parsed.data.windows.map((w) => ({
    id: uid('av'),
    doctorId: req.userId!,
    dayOfWeek: w.dayOfWeek,
    start: w.start,
    end: w.end,
  }))
  db.availability.push(...windows)
  writeAudit(req.userId!, 'updated availability')
  notify(req.userId!, 'system', 'Your schedule was updated', 'Your published hours have changed.')
  res.json({ windows })
})

doctorRouter.get('/notifications', (req: AuthedRequest, res) => {
  const items = db.notifications
    .filter((n) => n.userId === req.userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  res.json({ items })
})

doctorRouter.post('/notifications/read-all', (req: AuthedRequest, res) => {
  db.notifications
    .filter((n) => n.userId === req.userId)
    .forEach((n) => {
      n.read = true
    })
  res.json({ ok: true })
})
