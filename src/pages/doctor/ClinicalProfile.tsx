import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentView, CareNote, PrescriptionView } from '@shared/types'
import { json } from '@/lib/api'
import { formatFullDate, formatShortDate } from '@/lib/dates'
import { AppointmentStatus, PrescriptionStatusBadge } from '@/components/ui/StatusIndicator'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { useState } from 'react'

interface Clinical {
  user: { id: string; firstName: string; lastName: string; email: string }
  profile: { dateOfBirth: string; sex: string; preferredLanguage: string; age: number }
  lastAppointment: AppointmentView | null
  appointments: AppointmentView[]
  prescriptions: PrescriptionView[]
  notes: CareNote[]
}

export function ClinicalProfile() {
  const { id } = useParams()
  const [tab, setTab] = useState<'overview' | 'appointments' | 'prescriptions' | 'notes'>('overview')
  const query = useQuery({
    queryKey: ['doctor', 'patient', id],
    queryFn: () => json.get<Clinical>(`/api/doctor/patients/${id}`),
    enabled: Boolean(id),
  })

  if (query.isLoading) {
    return (
      <div className="lh-page">
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="lh-page">
        <ErrorState title="We couldn't load this record." body="You may not have a care relationship with this person." onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const data = query.data
  return (
    <div className="lh-page">
      <Link to="/doctor/patients" className="text-sm text-muted hover:text-ink">
        ← Patients
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">
            {data.user.firstName} {data.user.lastName}
          </h1>
          <p className="mt-2 text-sm text-muted">Patient · Age {data.profile.age}</p>
        </div>
        <div className="text-sm text-muted">
          Last appointment
          <br />
          <span className="text-ink">
            {data.lastAppointment ? formatFullDate(data.lastAppointment.startsAt) : '—'}
          </span>
        </div>
      </div>
      <div className="mt-8">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'overview', label: 'Overview' },
            { value: 'appointments', label: 'Appointments' },
            { value: 'prescriptions', label: 'Prescriptions' },
            { value: 'notes', label: 'Care notes' },
          ]}
        />
      </div>
      <div className="mt-8">
        {tab === 'overview' && (
          <dl className="grid gap-6 sm:grid-cols-3">
            <div>
              <dt className="lh-kicker">Language</dt>
              <dd className="mt-2 text-sm">{data.profile.preferredLanguage}</dd>
            </div>
            <div>
              <dt className="lh-kicker">Sex</dt>
              <dd className="mt-2 text-sm">{data.profile.sex || '—'}</dd>
            </div>
            <div>
              <dt className="lh-kicker">Born</dt>
              <dd className="mt-2 text-sm">{data.profile.dateOfBirth}</dd>
            </div>
          </dl>
        )}
        {tab === 'appointments' && (
          <ul className="divide-y divide-line border-t border-line">
            {!data.appointments.length ? (
              <li className="py-6 text-sm text-muted">No visits with this person yet.</li>
            ) : null}
            {data.appointments.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-4 text-sm">
                <span>
                  {formatShortDate(a.startsAt)} · {a.reason}
                </span>
                <AppointmentStatus status={a.status} />
              </li>
            ))}
          </ul>
        )}
        {tab === 'prescriptions' && (
          <ul className="divide-y divide-line border-t border-line">
            {!data.prescriptions.length ? (
              <li className="py-6 text-sm text-muted">No prescriptions issued yet.</li>
            ) : null}
            {data.prescriptions.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-4 text-sm">
                <span>
                  {p.medication} · {p.dosage}
                </span>
                <PrescriptionStatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        )}
        {tab === 'notes' && (
          <ul className="space-y-6">
            {!data.notes.length ? (
              <li className="text-sm text-muted">No care notes recorded yet.</li>
            ) : null}
            {data.notes.map((n) => (
              <li key={n.id}>
                <p className="text-xs text-muted">{formatFullDate(n.createdAt)}</p>
                <p className="mt-2 max-w-prose text-sm leading-relaxed">{n.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
