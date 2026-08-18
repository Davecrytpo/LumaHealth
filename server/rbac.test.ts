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

describe('role-based access', () => {
  it('keeps the patient portal off-limits to clinicians', async () => {
    const token = await signIn('amara@luma.health')
    const res = await request(app).get('/api/patient/overview').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/do not have access/i)
  })

  it('keeps admin tools off-limits to patients', async () => {
    const token = await signIn('david@luma.health')
    const res = await request(app).get('/api/admin/overview').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('allows an admin to read the audit log', async () => {
    const token = await signIn('admin@luma.health')
    const res = await request(app).get('/api/admin/audit-log').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.items.length).toBeGreaterThan(0)
  })

  it('blocks a clinician from another doctor’s patient record', async () => {
    const token = await signIn('weber@luma.health')
    const res = await request(app).get('/api/doctor/patients/user_sarah').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('requires a session', async () => {
    const res = await request(app).get('/api/patient/overview')
    expect(res.status).toBe(401)
  })
})
