import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { PatientProfile as Profile, PublicUser } from '@shared/types'
import { json } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Link } from 'react-router-dom'
import { useToast } from '@/context/ToastContext'

interface ProfileResponse {
  user: PublicUser
  profile: Profile
}

export function PatientProfile() {
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const query = useQuery({
    queryKey: ['patient', 'profile'],
    queryFn: () => json.get<ProfileResponse>('/api/patient/profile'),
  })
  const [form, setForm] = useState<ProfileResponse | null>(null)

  useEffect(() => {
    if (query.data) setForm(query.data)
  }, [query.data])

  const save = useMutation({
    mutationFn: () =>
      json.patch('/api/patient/profile', {
        firstName: form?.user.firstName,
        lastName: form?.user.lastName,
        phone: form?.profile.phone,
        address: form?.profile.address,
        city: form?.profile.city,
        dateOfBirth: form?.profile.dateOfBirth,
        sex: form?.profile.sex,
        preferredLanguage: form?.profile.preferredLanguage,
        emergencyContact: form?.profile.emergencyContact,
      }),
    onSuccess: () => {
      toast.push('Profile saved.')
      setEditing(false)
      void query.refetch()
    },
    onError: () => toast.push('We could not save those details.', 'error'),
  })

  if (query.isError) {
    return (
      <div className="lh-page">
        <ErrorState title="We couldn't load your profile." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }
  if (query.isLoading || !form) {
    return (
      <div className="lh-page">
        <Skeleton className="h-12 w-64" />
      </div>
    )
  }

  const sections = [
    {
      title: 'Personal information',
      fields: [
        ['First name', form.user.firstName, (v: string) => setForm({ ...form, user: { ...form.user, firstName: v } })],
        ['Last name', form.user.lastName, (v: string) => setForm({ ...form, user: { ...form.user, lastName: v } })],
        ['Date of birth', form.profile.dateOfBirth, (v: string) => setForm({ ...form, profile: { ...form.profile, dateOfBirth: v } })],
        ['Sex', form.profile.sex, (v: string) => setForm({ ...form, profile: { ...form.profile, sex: v } })],
      ],
    },
    {
      title: 'Contact information',
      fields: [
        ['Phone', form.profile.phone, (v: string) => setForm({ ...form, profile: { ...form.profile, phone: v } })],
        ['Address', form.profile.address, (v: string) => setForm({ ...form, profile: { ...form.profile, address: v } })],
        ['City', form.profile.city, (v: string) => setForm({ ...form, profile: { ...form.profile, city: v } })],
      ],
    },
    {
      title: 'Emergency contact',
      fields: [
        ['Name', form.profile.emergencyContact.name, (v: string) => setForm({ ...form, profile: { ...form.profile, emergencyContact: { ...form.profile.emergencyContact, name: v } } })],
        ['Relationship', form.profile.emergencyContact.relationship, (v: string) => setForm({ ...form, profile: { ...form.profile, emergencyContact: { ...form.profile.emergencyContact, relationship: v } } })],
        ['Phone', form.profile.emergencyContact.phone, (v: string) => setForm({ ...form, profile: { ...form.profile, emergencyContact: { ...form.profile.emergencyContact, phone: v } } })],
      ],
    },
    {
      title: 'Preferences',
      fields: [
        ['Language', form.profile.preferredLanguage, (v: string) => setForm({ ...form, profile: { ...form.profile, preferredLanguage: v } })],
      ],
    },
    {
      title: 'Security',
      fields: [['Email', form.user.email, null]],
    },
  ] as const

  return (
    <div className="lh-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl uppercase tracking-[0.04em]">
            {form.user.firstName} {form.user.lastName}
          </h1>
          <p className="mt-3 text-sm text-muted">Patient</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/patient/settings" className="text-sm text-muted hover:text-ink md:hidden">
            Settings →
          </Link>
          <Button variant="secondary" onClick={() => (editing ? save.mutate() : setEditing(true))} loading={save.isPending}>
            {editing ? 'Save profile' : 'Edit profile'}
          </Button>
        </div>
      </div>
      <div className="mt-12 space-y-12">
        {sections.map((section) => (
          <section key={section.title} className="border-t border-line pt-6">
            <h2 className="text-sm font-medium">{section.title}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {section.fields.map(([label, value, setter]) =>
                editing && setter ? (
                  <Input key={label} label={label} value={value} onChange={(e) => setter(e.target.value)} />
                ) : (
                  <div key={label}>
                    <p className="text-[13px] text-muted">{label}</p>
                    <p className="mt-1 text-sm">{value || '—'}</p>
                  </div>
                ),
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
