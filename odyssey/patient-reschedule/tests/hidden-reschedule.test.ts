import { beforeEach, describe, expect, it } from 'vitest'

// Sign-in uses bcrypt; first cases can exceed the default 5s on a cold container.
const CASE_TIMEOUT = 20_000
import request from 'supertest'
import { createApp } from './app.js'
import { createSeed } from './seed.js'
import { db, resetDatabase } from './store.js'
import { DEMO_PASSWORD } from '../shared/constants.js'

const app = createApp()

const SEED_APPOINTMENTS = 9
const SEED_NOTIFICATIONS = 6
const SEED_AUDIT = 4

const DAVID = 'david@luma.health'
const LEILA = 'leila@luma.health'
const AMARA = 'amara@luma.health'
const WEBER = 'weber@luma.health'

const OPEN_WED = '2026-08-19T11:00:00.000Z'
const OPEN_WED_END = '2026-08-19T11:30:00.000Z'
const OPEN_THU = '2026-08-20T10:00:00.000Z'
const OPEN_TUE_0930 = '2026-08-18T09:30:00.000Z'
const OPEN_TUE_0900 = '2026-08-18T09:00:00.000Z'
const DAVID_CURRENT = '2026-08-19T10:30:00.000Z'
const SARAH_SLOT = '2026-08-18T10:30:00.000Z'
const JAMES_SLOT = '2026-08-18T11:30:00.000Z'
const BEFORE_CLOCK = '2026-08-17T10:00:00.000Z'
const OUTSIDE_HOURS = '2026-08-19T08:00:00.000Z'

beforeEach(() => {
  resetDatabase(createSeed())
})

async function signIn(email: string) {
  const res = await request(app).post('/api/auth/sign-in').send({ email, password: DEMO_PASSWORD })
  expect(res.status).toBe(200)
  return res.body.token as string
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` }
}

function davidAmaraUpcoming() {
  return db.appointments.filter(
    (a) =>
      a.patientId === 'user_david' &&
      a.doctorId === 'user_amara' &&
      (a.status === 'confirmed' || a.status === 'pending'),
  )
}

function heldAmara(startsAt: string) {
  return db.appointments.filter(
    (a) =>
      a.doctorId === 'user_amara' &&
      a.startsAt === startsAt &&
      (a.status === 'confirmed' || a.status === 'pending'),
  )
}

describe('patient reschedule identity', { timeout: CASE_TIMEOUT }, () => {
  it('keeps the same appointment id, times, and status after a move', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Follow-up after recent blood pressure readings' })

    expect(res.status).toBe(200)
    expect(res.body.id).toBe('apt_david_amara')
    expect(res.body.startsAt).toBe(OPEN_WED)
    expect(res.body.endsAt).toBe(OPEN_WED_END)
    expect(res.body.status).toBe('confirmed')
    expect(res.body.patientId).toBe('user_david')
    expect(res.body.doctorId).toBe('user_amara')
  })

  it('does not add a row or duplicate the id', async () => {
    const token = await signIn(DAVID)
    await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Follow-up after recent blood pressure readings' })

    expect(db.appointments.filter((a) => a.id === 'apt_david_amara')).toHaveLength(1)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
  })

  it('keeps a single upcoming visit with that clinician', async () => {
    const token = await signIn(DAVID)
    await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Follow-up after recent blood pressure readings' })

    const list = await request(app).get('/api/patient/appointments?tab=upcoming').set(auth(token))
    expect(list.status).toBe(200)
    const amara = list.body.items.filter((a: { doctorId: string }) => a.doctorId === 'user_amara')
    expect(amara).toHaveLength(1)
    expect(amara[0].id).toBe('apt_david_amara')
    expect(amara[0].startsAt).toBe(OPEN_WED)
    expect(davidAmaraUpcoming()).toHaveLength(1)
  })

  it('releases the old time so it can be booked again', async () => {
    const token = await signIn(DAVID)
    const move = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Follow-up after recent blood pressure readings' })
    expect(move.status).toBe(200)
    expect(heldAmara(DAVID_CURRENT)).toHaveLength(0)
    expect(heldAmara(OPEN_WED)).toHaveLength(1)

    const book = await request(app).post('/api/patient/appointments').set(auth(token)).send({
      doctorId: 'user_amara',
      startsAt: DAVID_CURRENT,
      type: 'video',
      reason: 'Released slot check',
    })
    expect(book.status).toBe(201)
    expect(book.body.id).not.toBe('apt_david_amara')
  })
})

describe('no duplicate booking', { timeout: CASE_TIMEOUT }, () => {
  it('does not leave two live visits for David with Amara after a reschedule', async () => {
    const token = await signIn(DAVID)
    await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Follow-up after recent blood pressure readings' })
    expect(davidAmaraUpcoming()).toHaveLength(1)
  })

  it('still creates a new appointment when the patient is booking, not moving', async () => {
    const token = await signIn(DAVID)
    const res = await request(app).post('/api/patient/appointments').set(auth(token)).send({
      doctorId: 'user_amara',
      startsAt: OPEN_THU,
      type: 'video',
      reason: 'New skin question',
    })
    expect(res.status).toBe(201)
    expect(res.body.id).not.toBe('apt_david_amara')
    expect(res.body.status).toBe('confirmed')
    expect(res.body.startsAt).toBe(OPEN_THU)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS + 1)
  })
})

describe('occupied confirmed times', { timeout: CASE_TIMEOUT }, () => {
  it('rejects moving onto Sarah’s confirmed Tuesday 10:30', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: SARAH_SLOT, type: 'video', reason: 'Overlap' })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/no longer available/i)
    expect(db.appointments.find((a) => a.id === 'apt_david_amara')?.startsAt).toBe(DAVID_CURRENT)
    expect(db.appointments.find((a) => a.id === 'apt_sarah_today')?.startsAt).toBe(SARAH_SLOT)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
  })

  it('rejects moving onto James’s confirmed Tuesday 11:30', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: JAMES_SLOT, type: 'video', reason: 'Overlap' })
    expect(res.status).toBe(409)
    expect(db.appointments.find((a) => a.id === 'apt_david_amara')?.startsAt).toBe(DAVID_CURRENT)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
  })

  it('still refuses a new booking of Sarah’s Tuesday 10:30', async () => {
    const token = await signIn(DAVID)
    const res = await request(app).post('/api/patient/appointments').set(auth(token)).send({
      doctorId: 'user_amara',
      startsAt: SARAH_SLOT,
      type: 'video',
      reason: 'Overlap',
    })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/no longer available/i)
  })
})

describe('pending occupancy', { timeout: CASE_TIMEOUT }, () => {
  async function placePendingOnPublishedChip() {
    const clinician = await signIn(AMARA)
    const moved = await request(app)
      .patch('/api/doctor/appointments/apt_leila_pending')
      .set(auth(clinician))
      .send({ startsAt: OPEN_TUE_0930 })
    expect(moved.status).toBe(200)
    expect(moved.body.id).toBe('apt_leila_pending')
    expect(moved.body.status).toBe('pending')
    expect(moved.body.startsAt).toBe(OPEN_TUE_0930)
    expect(moved.body.endsAt).toBe('2026-08-18T10:00:00.000Z')
    return clinician
  }

  it('rejects a patient move onto a pending visit’s published time', async () => {
    await placePendingOnPublishedChip()
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_TUE_0930, type: 'video', reason: 'Pending overlap' })
    expect(res.status).toBe(409)
    expect(db.appointments.find((a) => a.id === 'apt_leila_pending')?.status).toBe('pending')
    expect(db.appointments.find((a) => a.id === 'apt_leila_pending')?.startsAt).toBe(OPEN_TUE_0930)
    expect(db.appointments.find((a) => a.id === 'apt_david_amara')?.startsAt).toBe(DAVID_CURRENT)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
  })

  it('rejects a new booking onto that same pending time', async () => {
    await placePendingOnPublishedChip()
    const token = await signIn(DAVID)
    const res = await request(app).post('/api/patient/appointments').set(auth(token)).send({
      doctorId: 'user_amara',
      startsAt: OPEN_TUE_0930,
      type: 'video',
      reason: 'Pending overlap',
    })
    expect(res.status).toBe(409)
  })
})

describe('availability and clock', { timeout: CASE_TIMEOUT }, () => {
  it('rejects a time outside published hours', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OUTSIDE_HOURS, type: 'video', reason: 'Too early' })
    expect(res.status).toBe(409)
    expect(db.appointments.find((a) => a.id === 'apt_david_amara')?.startsAt).toBe(DAVID_CURRENT)
  })

  it('rejects a time at or before the product clock', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: BEFORE_CLOCK, type: 'video', reason: 'Yesterday' })
    expect(res.status).toBe(409)
  })

  it('rejects moving onto the visit’s own current time', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: DAVID_CURRENT, type: 'video', reason: 'Same chip' })
    expect(res.status).toBe(409)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
  })
})

describe('audit and inbox', { timeout: CASE_TIMEOUT }, () => {
  it('writes rescheduled an appointment and does not add a book audit', async () => {
    const token = await signIn(DAVID)
    const beforeBookAudits = db.audit.filter((a) => a.action === 'booked an appointment with Dr. Okafor').length
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Follow-up after recent blood pressure readings' })
    expect(res.status).toBe(200)
    expect(db.audit).toHaveLength(SEED_AUDIT + 1)
    expect(db.audit[0].action).toBe('rescheduled an appointment')
    expect(db.audit[0].actorId).toBe('user_david')
    expect(db.audit[0].actorName).toBe('David Daniel')
    expect(db.audit.filter((a) => a.action === 'booked an appointment with Dr. Okafor')).toHaveLength(beforeBookAudits)
  })

  it('does not add inbox rows on a successful reschedule', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Follow-up after recent blood pressure readings' })
    expect(res.status).toBe(200)
    expect(db.notifications).toHaveLength(SEED_NOTIFICATIONS)
    expect(db.notifications.filter((n) => n.title === 'Appointment confirmed')).toHaveLength(1)
    expect(db.notifications.filter((n) => n.title === 'New appointment')).toHaveLength(1)
  })

  it('still notifies both sides on a genuine new booking', async () => {
    const token = await signIn(DAVID)
    const res = await request(app).post('/api/patient/appointments').set(auth(token)).send({
      doctorId: 'user_amara',
      startsAt: OPEN_THU,
      type: 'video',
      reason: 'New skin question',
    })
    expect(res.status).toBe(201)
    expect(db.notifications).toHaveLength(SEED_NOTIFICATIONS + 2)
    expect(db.audit[0].action).toBe('booked an appointment with Dr. Okafor')
    expect(db.notifications.some((n) => n.userId === 'user_david' && n.title === 'Appointment confirmed')).toBe(true)
    expect(db.notifications.some((n) => n.userId === 'user_amara' && n.title === 'New appointment')).toBe(true)
  })

  it('honors appointment reminders on a new booking', async () => {
    const token = await signIn(DAVID)
    const settings = await request(app).patch('/api/auth/settings').set(auth(token)).send({
      notifications: {
        appointmentReminders: false,
        prescriptionUpdates: true,
        careTeamMessages: true,
      },
    })
    expect(settings.status).toBe(200)
    const res = await request(app).post('/api/patient/appointments').set(auth(token)).send({
      doctorId: 'user_amara',
      startsAt: OPEN_THU,
      type: 'video',
      reason: 'New skin question',
    })
    expect(res.status).toBe(201)
    expect(db.notifications.filter((n) => n.userId === 'user_david' && n.kind === 'appointment')).toHaveLength(1)
    expect(db.notifications.some((n) => n.userId === 'user_amara' && n.title === 'New appointment')).toBe(true)
  })

  it('keeps a clinician move silent and in place', async () => {
    const token = await signIn(AMARA)
    const res = await request(app)
      .patch('/api/doctor/appointments/apt_sarah_today')
      .set(auth(token))
      .send({ startsAt: OPEN_TUE_0900 })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('apt_sarah_today')
    expect(res.body.status).toBe('confirmed')
    expect(res.body.startsAt).toBe(OPEN_TUE_0900)
    expect(db.audit).toHaveLength(SEED_AUDIT)
    expect(db.notifications).toHaveLength(SEED_NOTIFICATIONS)
  })
})

describe('ownership', { timeout: CASE_TIMEOUT }, () => {
  it('returns 404 when a patient reads someone else’s visit', async () => {
    const token = await signIn(DAVID)
    const res = await request(app).get('/api/patient/appointments/apt_sarah_today').set(auth(token))
    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/could not find that appointment/i)
  })

  it('returns 404 when a patient tries to move someone else’s visit', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_sarah_today')
      .set(auth(token))
      .send({ startsAt: OPEN_WED, type: 'video', reason: 'Should not work' })
    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/could not find that appointment/i)
    expect(db.appointments.find((a) => a.id === 'apt_sarah_today')?.startsAt).toBe(SARAH_SLOT)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
    expect(heldAmara(OPEN_WED)).toHaveLength(0)
  })

  it('returns 404 for a missing visit', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_does_not_exist')
      .set(auth(token))
      .send({ startsAt: OPEN_WED })
    expect(res.status).toBe(404)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
  })

  it('returns 404 when another clinician tries to move the visit', async () => {
    const token = await signIn(WEBER)
    const res = await request(app)
      .patch('/api/doctor/appointments/apt_sarah_today')
      .set(auth(token))
      .send({ startsAt: OPEN_TUE_0900 })
    expect(res.status).toBe(404)
    expect(db.appointments.find((a) => a.id === 'apt_sarah_today')?.startsAt).toBe(SARAH_SLOT)
  })

  it('keeps cross-portal access as 403', async () => {
    const token = await signIn(AMARA)
    const res = await request(app).get('/api/patient/appointments/apt_david_amara').set(auth(token))
    expect(res.status).toBe(403)
    expect(db.appointments.find((a) => a.id === 'apt_david_amara')?.startsAt).toBe(DAVID_CURRENT)
  })
})

describe('existing booking and cancel still work', { timeout: CASE_TIMEOUT }, () => {
  it('cancels the existing visit in place', async () => {
    const token = await signIn(DAVID)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set(auth(token))
      .send({ status: 'cancelled' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('apt_david_amara')
    expect(res.body.status).toBe('cancelled')
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
    expect(db.audit[0].action).toBe('cancelled an appointment')
    expect(db.notifications.some((n) => n.userId === 'user_amara' && n.title === 'Appointment cancelled')).toBe(true)
  })

  it('lets a clinician complete a visit', async () => {
    const token = await signIn(AMARA)
    const res = await request(app)
      .patch('/api/doctor/appointments/apt_sarah_today')
      .set(auth(token))
      .send({ status: 'completed' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('completed')
  })

  it('promotes a pending visit to confirmed when that patient moves it', async () => {
    const token = await signIn(LEILA)
    const res = await request(app)
      .patch('/api/patient/appointments/apt_leila_pending')
      .set(auth(token))
      .send({ startsAt: OPEN_THU, type: 'video', reason: 'New patient introduction' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('apt_leila_pending')
    expect(res.body.status).toBe('confirmed')
    expect(res.body.startsAt).toBe(OPEN_THU)
    expect(heldAmara('2026-08-18T14:00:00.000Z')).toHaveLength(0)
    expect(db.appointments).toHaveLength(SEED_APPOINTMENTS)
  })
})
