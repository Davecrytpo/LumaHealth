import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentView } from '@shared/types'
import { json } from '@/lib/api'
import { formatTime, formatFullDate } from '@/lib/dates'
import { Tabs } from '@/components/ui/Tabs'
import { AppointmentStatus } from '@/components/ui/StatusIndicator'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

type Tab = 'upcoming' | 'past' | 'cancelled'

export function PatientAppointments() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const query = useQuery({
    queryKey: ['patient', 'appointments', tab],
    queryFn: () => json.get<{ items: AppointmentView[] }>(`/api/patient/appointments?tab=${tab}`),
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Appointments</h1>
      <div className="mt-8">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
        />
      </div>
      <div className="mt-8">
        {query.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : query.isError ? (
          <ErrorState
            title="We couldn't load your appointments."
            body="Your other care information is still available."
            onRetry={() => void query.refetch()}
          />
        ) : !query.data?.items.length ? (
          <EmptyState
            title={tab === 'upcoming' ? 'Your calendar is clear.' : 'Nothing in this list yet.'}
            body={
              tab === 'upcoming'
                ? "You don’t have any upcoming appointments."
                : 'When visits move here, they will appear as a timeline.'
            }
            action={tab === 'upcoming' ? { label: 'Find a clinician', to: '/patient/find-care' } : undefined}
          />
        ) : (
          <ol className="divide-y divide-line border-t border-line">
            {query.data.items.map((apt) => (
              <li key={apt.id} className="grid gap-2 py-5 md:grid-cols-[10rem_1fr_auto] md:items-baseline">
                <time className="text-sm text-muted" dateTime={apt.startsAt}>
                  {formatFullDate(apt.startsAt)}
                </time>
                <div>
                  <p className="text-sm">
                    Dr. {apt.doctor.lastName} · {apt.doctor.specialty}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatTime(apt.startsAt)} · {apt.type === 'video' ? 'Video' : 'In person'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <AppointmentStatus status={apt.status} />
                  <Link to={`/patient/appointments/${apt.id}`} className="text-sm hover:underline">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
