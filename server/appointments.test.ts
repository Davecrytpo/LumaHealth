import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'
import { createSeed } from './seed.js'
import { resetDatabase } from './store.js'
import { DEMO_PASSWORD } from '../shared/constants.js'
import { generateSlots } from './lib.js'

const app = createApp()

beforeEach(() => {
  resetDatabase(createSeed())
})

async function signIn(email: string) {
  const res = await request(app).post('/api/auth/sign-in').send({ email, password: DEMO_PASSWORD })
  return res.body.token as string
}

describe('appointments', () => {
  it('returns David’s next visit on the overview', async () => {
    const token = await signIn('david@luma.health')
    const res = await request(app).get('/api/patient/overview').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.nextAppointment.doctor.lastName).toBe('Okafor')
    expect(res.body.nextAppointment.startsAt).toBe('2026-08-19T10:30:00.000Z')
  })

  it('books an open slot and confirms in human language', async () => {
    const token = await signIn('david@luma.health')
    const open = generateSlots('user_amara', '2026-08-18T00:00:00.000Z', 7).find((s) => s.available)
    expect(open).toBeTruthy()
    const res = await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId: 'user_amara',
        startsAt: open!.startsAt,
        type: 'video',
        reason: 'Blood pressure follow-up',
      })
    expect(res.status).toBe(201)
    expect(res.body.status).toBe('confirmed')
    expect(res.body.doctor.lastName).toBe('Okafor')
  })

  it('refuses a slot that is already taken', async () => {
    const token = await signIn('david@luma.health')
    const res = await request(app)
      .post('/api/patient/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        doctorId: 'user_amara',
        startsAt: '2026-08-18T10:30:00.000Z',
        type: 'video',
        reason: 'Overlap',
      })
    expect(res.status).toBe(409)
    expect(res.body.message).toMatch(/no longer available/i)
  })

  it('cancels an appointment', async () => {
    const token = await signIn('david@luma.health')
    const res = await request(app)
      .patch('/api/patient/appointments/apt_david_amara')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'cancelled' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('cancelled')
  })

  it('lets a clinician complete a visit', async () => {
    const token = await signIn('amara@luma.health')
    const res = await request(app)
      .patch('/api/doctor/appointments/apt_sarah_today')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('completed')
  })
})
