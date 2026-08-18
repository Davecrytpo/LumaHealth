import { describe, expect, it } from 'vitest'
import { bookAppointmentSchema, signInSchema, signUpSchema } from './schemas'

describe('schemas', () => {
  it('rejects an empty sign-in', () => {
    const result = signInSchema.safeParse({ email: '', password: '' })
    expect(result.success).toBe(false)
  })

  it('accepts a complete sign-up', () => {
    const result = signUpSchema.safeParse({
      role: 'patient',
      firstName: 'David',
      lastName: 'Daniel',
      email: 'david@luma.health',
      phone: '+49 151 000',
      password: 'luma-demo',
      appearance: 'system',
    })
    expect(result.success).toBe(true)
  })

  it('requires a reason to book', () => {
    const result = bookAppointmentSchema.safeParse({
      doctorId: 'user_amara',
      startsAt: '2026-08-19T11:00:00.000Z',
      type: 'video',
      reason: '',
    })
    expect(result.success).toBe(false)
  })
})
