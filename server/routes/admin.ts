import { Router } from 'express'
import { adminDoctorUpdateSchema, adminUserUpdateSchema } from '../../shared/schemas.js'
import { db } from '../store.js'
import { getDoctorProfile, getUser, toPublicUser, writeAudit } from '../lib.js'
import { authRequired, requireRole, type AuthedRequest } from '../middleware.js'

export const adminRouter = Router()
adminRouter.use(authRequired, requireRole('admin'))

adminRouter.get('/overview', (_req, res) => {
  const appointmentsToday = db.appointments.filter((a) => a.startsAt.startsWith('2026-08-18')).length
  const pendingActions =
    db.appointments.filter((a) => a.status === 'pending').length +
    db.doctors.filter((d) => d.verificationStatus === 'pending').length
  res.json({
    activePatients: db.users.filter((u) => u.role === 'patient' && u.status === 'active').length,
    clinicians: db.users.filter((u) => u.role === 'clinician' && u.status === 'active').length,
    appointmentsToday,
    pendingActions,
    activity: db.audit.slice(0, 12),
  })
})

adminRouter.get('/users', (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase()
  const items = db.users
    .filter((u) => u.role !== 'admin')
    .filter((u) => {
      if (!q) return true
      return `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(q)
    })
    .map(toPublicUser)
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
  res.json({ items })
})

adminRouter.patch('/users/:id', (req: AuthedRequest, res) => {
  const parsed = adminUserUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those user details could not be saved.' })
    return
  }
  const user = getUser(String(req.params.id))
  if (!user) {
    res.status(404).json({ message: 'We could not find that person.' })
    return
  }
  if (parsed.data.status) user.status = parsed.data.status
  writeAudit(req.userId!, `updated ${user.firstName} ${user.lastName}`)
  res.json(toPublicUser(user))
})

adminRouter.get('/doctors', (_req, res) => {
  const items = db.doctors.map((d) => {
    const user = getUser(d.userId)
    const appointments = db.appointments.filter((a) => a.doctorId === d.userId).length
    return {
      id: d.userId,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      specialty: d.specialty,
      verificationStatus: d.verificationStatus,
      status: user?.status ?? 'active',
      appointments,
    }
  })
  res.json({ items })
})

adminRouter.patch('/doctors/:id', (req: AuthedRequest, res) => {
  const parsed = adminDoctorUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those clinician details could not be saved.' })
    return
  }
  const profile = getDoctorProfile(String(req.params.id))
  const user = getUser(String(req.params.id))
  if (!profile || !user) {
    res.status(404).json({ message: 'We could not find that clinician.' })
    return
  }
  if (parsed.data.verificationStatus) profile.verificationStatus = parsed.data.verificationStatus
  if (parsed.data.status) user.status = parsed.data.status
  writeAudit(req.userId!, `updated clinician ${user.lastName}`)
  res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    specialty: profile.specialty,
    verificationStatus: profile.verificationStatus,
    status: user.status,
  })
})

adminRouter.get('/appointments', (req, res) => {
  const date = String(req.query.date ?? '')
  const doctorId = String(req.query.doctorId ?? '')
  const status = String(req.query.status ?? '')
  const type = String(req.query.type ?? '')
  const items = db.appointments
    .filter((a) => (date ? a.startsAt.startsWith(date) : true))
    .filter((a) => (doctorId ? a.doctorId === doctorId : true))
    .filter((a) => (status ? a.status === status : true))
    .filter((a) => (type ? a.type === type : true))
    .sort((a, b) => b.startsAt.localeCompare(a.startsAt))
    .map((a) => {
      const patient = getUser(a.patientId)
      const doctor = getUser(a.doctorId)
      const profile = getDoctorProfile(a.doctorId)
      return {
        ...a,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
        doctorName: doctor ? `Dr. ${doctor.lastName}` : 'Unknown',
        specialty: profile?.specialty ?? '',
      }
    })
  res.json({ items })
})

adminRouter.get('/audit-log', (_req, res) => {
  res.json({ items: db.audit })
})

adminRouter.get('/settings', (_req, res) => {
  res.json({
    environment: 'synthetic-baseline',
    maintenance: false,
    bookingsOpen: true,
    dataNotice: 'All records in this environment are fictional.',
  })
})
