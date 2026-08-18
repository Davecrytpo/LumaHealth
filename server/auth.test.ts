import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from './app.js'
import { createSeed } from './seed.js'
import { resetDatabase, sessions } from './store.js'
import { DEMO_PASSWORD } from '../shared/constants.js'

const app = createApp()

beforeEach(() => {
  resetDatabase(createSeed())
})

afterEach(() => {
  sessions.clear()
})

describe('auth', () => {
  it('signs in a patient with synthetic credentials', async () => {
    const res = await request(app).post('/api/auth/sign-in').send({
      email: 'david@luma.health',
      password: DEMO_PASSWORD,
    })
    expect(res.status).toBe(200)
    expect(res.body.user.role).toBe('patient')
    expect(res.body.user.firstName).toBe('David')
    expect(res.body.token).toBeTruthy()
  })

  it('rejects unknown credentials in plain language', async () => {
    const res = await request(app).post('/api/auth/sign-in').send({
      email: 'david@luma.health',
      password: 'wrong-password',
    })
    expect(res.status).toBe(401)
    expect(res.body.message).toMatch(/did not match/i)
  })

  it('creates a patient account and returns a session', async () => {
    const res = await request(app).post('/api/auth/sign-up').send({
      role: 'patient',
      firstName: 'Ada',
      lastName: 'Okeke',
      email: 'ada@luma.health',
      phone: '+49 151 1111222',
      password: 'luma-demo',
      appearance: 'light',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.role).toBe('patient')
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${res.body.token}`)
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe('ada@luma.health')
  })

  it('records a password reset without leaking whether the email exists', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({
      email: 'anyone@luma.health',
    })
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/Check your inbox/)
  })
})
