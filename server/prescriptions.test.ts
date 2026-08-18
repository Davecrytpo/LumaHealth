import { beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'
import { createSeed } from './seed.js'
import { resetDatabase } from './store.js'
import { DEMO_PASSWORD } from '../shared/constants.js'

const app = createApp()

beforeEach(() => {
  resetDatabase(createSeed())
})

async function signIn(email: string) {
  const res = await request(app).post('/api/auth/sign-in').send({ email, password: DEMO_PASSWORD })
  return res.body.token as string
}

describe('prescriptions', () => {
  it('lists David’s active medications', async () => {
    const token = await signIn('david@luma.health')
    const res = await request(app).get('/api/patient/prescriptions').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.items.some((p: { medication: string }) => p.medication === 'Metformin')).toBe(true)
  })

  it('lets a clinician write a prescription', async () => {
    const token = await signIn('amara@luma.health')
    const res = await request(app)
      .post('/api/doctor/prescriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId: 'user_sarah',
        medication: 'Ramipril',
        dosage: '5 mg',
        frequency: 'Once daily',
        startDate: '2026-08-18',
        endDate: '2026-11-18',
        refills: 2,
        instructions: 'Take in the morning.',
      })
    expect(res.status).toBe(201)
    expect(res.body.medication).toBe('Ramipril')
    expect(res.body.patient.lastName).toBe('Miller')
  })

  it('refuses a prescription for someone the clinician does not treat', async () => {
    const token = await signIn('weber@luma.health')
    const res = await request(app)
      .post('/api/doctor/prescriptions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        patientId: 'user_sarah',
        medication: 'Ibuprofen',
        dosage: '200 mg',
        frequency: 'As needed',
        startDate: '2026-08-18',
        endDate: '2026-09-18',
        refills: 0,
        instructions: 'With food.',
      })
    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/care relationship/i)
  })
})
