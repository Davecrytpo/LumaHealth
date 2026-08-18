import { Router } from 'express'
import bcrypt from 'bcryptjs'
import {
  forgotPasswordSchema,
  settingsUpdateSchema,
  signInSchema,
  signUpSchema,
} from '../../shared/schemas.js'
import { db, sessions, uid } from '../store.js'
import { toSessionUser, writeAudit } from '../lib.js'
import { asyncHandler, authRequired, currentUser, type AuthedRequest } from '../middleware.js'

export const authRouter = Router()

authRouter.post(
  '/sign-in',
  asyncHandler(async (req, res) => {
    const parsed = signInSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Check your details.' })
      return
    }
    const email = parsed.data.email.trim().toLowerCase()
    const user = db.users.find((u) => u.email === email)
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      res.status(401).json({ message: 'Those details did not match our records.' })
      return
    }
    if (user.status === 'suspended') {
      res.status(403).json({ message: 'This account has been suspended.' })
      return
    }
    const token = uid('tok')
    sessions.set(token, { userId: user.id, role: user.role })
    user.lastActiveAt = new Date().toISOString()
    res.json({ token, user: toSessionUser(user) })
  }),
)

authRouter.post(
  '/sign-up',
  asyncHandler(async (req, res) => {
    const parsed = signUpSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Check your details.' })
      return
    }
    const data = parsed.data
    const email = data.email.trim().toLowerCase()
    if (db.users.some((u) => u.email === email)) {
      res.status(409).json({ message: 'An account with this email already exists.' })
      return
    }
    const id = uid('user')
    const now = new Date().toISOString()
    const passwordHash = await bcrypt.hash(data.password, 8)
    const user = {
      id,
      email,
      passwordHash,
      role: data.role,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      status: 'active' as const,
      createdAt: now,
      lastActiveAt: now,
      appearance: data.appearance,
    }
    db.users.push(user)
    if (data.role === 'patient') {
      db.patients.push({
        userId: id,
        dateOfBirth: data.dateOfBirth ?? '1990-01-01',
        sex: data.sex ?? '',
        phone: data.phone,
        address: '',
        city: '',
        emergencyContact: { name: '', relationship: '', phone: '' },
        preferredLanguage: data.preferredLanguage ?? 'English',
        notifications: {
          appointmentReminders: true,
          prescriptionUpdates: true,
          careTeamMessages: true,
        },
      })
    } else {
      db.doctors.push({
        userId: id,
        title: 'Dr.',
        specialty: data.specialty ?? 'Family medicine',
        bio: '',
        yearsExperience: 0,
        languages: [data.preferredLanguage ?? 'English'],
        consultationTypes: ['video'],
        verificationStatus: 'pending',
      })
    }
    writeAudit(id, 'created an account')
    const token = uid('tok')
    sessions.set(token, { userId: id, role: user.role })
    res.status(201).json({ token, user: toSessionUser(user) })
  }),
)

authRouter.post('/forgot-password', (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? 'Enter a valid email.' })
    return
  }
  db.passwordResets.push({
    email: parsed.data.email.trim().toLowerCase(),
    sentAt: new Date().toISOString(),
  })
  res.json({
    message: "Check your inbox. We've sent instructions to reset your password.",
  })
})

authRouter.get('/me', authRequired, (req: AuthedRequest, res) => {
  const user = currentUser(req)
  if (!user) {
    res.status(401).json({ message: 'Please sign in to continue.' })
    return
  }
  res.json({ user })
})

authRouter.post('/sign-out', authRequired, (req: AuthedRequest, res) => {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (token) sessions.delete(token)
  res.json({ ok: true })
})

authRouter.patch('/settings', authRequired, (req: AuthedRequest, res) => {
  const parsed = settingsUpdateSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Those settings could not be saved.' })
    return
  }
  const user = db.users.find((u) => u.id === req.userId)
  if (!user) {
    res.status(404).json({ message: 'Account not found.' })
    return
  }
  if (parsed.data.appearance) user.appearance = parsed.data.appearance
  if (parsed.data.notifications) {
    const patient = db.patients.find((p) => p.userId === user.id)
    if (patient) patient.notifications = parsed.data.notifications
  }
  res.json({ user: toSessionUser(user) })
})
