import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentStatus, ConsultationType } from '@shared/types'
import { json } from '@/lib/api'
import { formatFullDate, formatTime } from '@/lib/dates'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { AppointmentStatus as StatusBadge } from '@/components/ui/StatusIndicator'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

interface Row {
  id: string
  startsAt: string
  type: ConsultationType
  status: AppointmentStatus
  patientName: string
  doctorName: string
  specialty: string
  doctorId: string
}

export function AdminAppointments() {
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const params = new URLSearchParams({ date, status, type, doctorId })
  const query = useQuery({
    queryKey: ['admin', 'appointments', date, status, type, doctorId],
    queryFn: () => json.get<{ items: Row[] }>(`/api/admin/appointments?${params}`),
  })
  const doctors = useQuery({
    queryKey: ['admin', 'doctors'],
    queryFn: () =>
      json.get<{ items: { id: string; firstName: string; lastName: string }[] }>('/api/admin/doctors'),
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Appointments</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select
          label="Doctor"
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          options={[
            { value: '', label: 'Any' },
            ...(doctors.data?.items.map((d) => ({
              value: d.id,
              label: `Dr. ${d.firstName} ${d.lastName}`,
            })) ?? []),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: '', label: 'Any' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { value: '', label: 'Any' },
            { value: 'video', label: 'Video' },
            { value: 'in-person', label: 'In person' },
          ]}
        />
      </div>
      <div className="mt-8">
        {query.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <ErrorState title="We couldn't load appointments." body="Please try again." onRetry={() => void query.refetch()} />
        ) : !query.data?.items.length ? (
          <EmptyState title="No appointments match." body="Widen the filters to see more." />
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {query.data.items.map((a) => (
              <li key={a.id} className="grid gap-2 py-4 text-sm md:grid-cols-[10rem_1fr_auto]">
                <span className="text-muted">
                  {formatFullDate(a.startsAt)} · {formatTime(a.startsAt)}
                </span>
                <span>
                  {a.patientName} with {a.doctorName}
                </span>
                <StatusBadge status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
