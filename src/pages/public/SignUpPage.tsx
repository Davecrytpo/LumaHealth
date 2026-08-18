import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, homeForRole } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { SPECIALTIES } from '@shared/constants'
import { cn } from '@/lib/cn'
import type { SignUpPayload } from '@shared/types'

const steps = ['01', '02', '03', '04']

export function SignUpPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SignUpPayload>({
    role: 'patient',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    sex: '',
    email: '',
    phone: '',
    password: '',
    preferredLanguage: 'English',
    specialty: 'Family medicine',
    appearance: 'system',
  })

  function update<K extends keyof SignUpPayload>(key: K, value: SignUpPayload[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (step < 4) {
      setStep((s) => s + 1)
      return
    }
    setError('')
    setLoading(true)
    try {
      const user = await signUp(form)
      navigate(homeForRole(user.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'We could not create your account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-xl px-4 py-6 md:px-8 md:py-10">
        <Link to="/" className="text-sm font-semibold">
          LumaHealth
        </Link>
        <ol className="mt-8 flex items-center gap-2 text-xs tracking-[0.16em] text-muted md:mt-10 md:gap-3" aria-label="Progress">
          {steps.map((label, i) => (
            <li key={label} className="flex items-center gap-2 md:gap-3">
              <span className={cn(step === i + 1 ? 'text-ink' : '')}>{label}</span>
              {i < steps.length - 1 ? <span className="w-6 border-t border-line md:w-10" /> : null}
            </li>
          ))}
        </ol>

        <form onSubmit={onSubmit} className="mt-10 space-y-6">
          {step === 1 && (
            <div>
              <h1 className="lh-display">Create your account</h1>
              <fieldset className="mt-8 space-y-3">
                <legend className="text-sm text-muted">I am a:</legend>
                {(['patient', 'clinician'] as const).map((role) => (
                  <label
                    key={role}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm',
                      form.role === role ? 'border-ink' : 'border-line',
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={form.role === role}
                      onChange={() => update('role', role)}
                      className="accent-ink"
                    />
                    {role === 'patient' ? 'Patient' : 'Clinician'}
                  </label>
                ))}
              </fieldset>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h1 className="lh-display">Personal information</h1>
              <Input label="First name" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
              <Input label="Last name" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
              {form.role === 'patient' ? (
                <>
                  <Input label="Date of birth" type="date" value={form.dateOfBirth ?? ''} onChange={(e) => update('dateOfBirth', e.target.value)} />
                  <Input label="Sex" value={form.sex ?? ''} onChange={(e) => update('sex', e.target.value)} />
                </>
              ) : (
                <Select
                  label="Specialty"
                  value={form.specialty}
                  onChange={(e) => update('specialty', e.target.value)}
                  options={SPECIALTIES.map((s) => ({ value: s, label: s }))}
                />
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h1 className="lh-display">Contact information</h1>
              <Input label="Email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              <Input label="Phone" type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                hint="Use at least 8 characters."
                required
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h1 className="lh-display">Preferences</h1>
              <Select
                label="Preferred language"
                value={form.preferredLanguage}
                onChange={(e) => update('preferredLanguage', e.target.value)}
                options={['English', 'German', 'French', 'Spanish'].map((s) => ({ value: s, label: s }))}
              />
              <Select
                label="Appearance"
                value={form.appearance}
                onChange={(e) => update('appearance', e.target.value as SignUpPayload['appearance'])}
                options={[
                  { value: 'system', label: 'System' },
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                ]}
              />
            </div>
          )}

          {error ? (
            <p className="text-sm text-terracotta" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-4 md:flex-row md:items-center md:justify-between">
            {step > 1 ? (
              <Button type="button" variant="tertiary" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            ) : (
              <span className="hidden md:block" />
            )}
            <Button type="submit" className="w-full md:w-auto" loading={loading}>
              {step === 4 ? 'Create account →' : 'Continue →'}
            </Button>
          </div>
          <p className="text-sm text-muted">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-ink hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
