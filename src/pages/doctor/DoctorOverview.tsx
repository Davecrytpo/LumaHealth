import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { DoctorOverview as Overview } from '@shared/types'
import { json } from '@/lib/api'
import { formatTime, greetingForHour } from '@/lib/dates'
import { AppointmentStatus } from '@/components/ui/StatusIndicator'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export function DoctorOverview() {
  const query = useQuery({
    queryKey: ['doctor', 'overview'],
    queryFn: () => json.get<Overview>('/api/doctor/overview'),
  })

  if (query.isLoading) {
    return (
      <div className="lh-page space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="lh-page">
        <ErrorState title="We couldn't load today." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const data = query.data
  return (
    <div className="lh-page">
      <h1 className="lh-display">
        {greetingForHour()}, {data.greetingName}.
      </h1>
      <section className="mt-10">
        <p className="lh-kicker">Today</p>
        <ul className="mt-5 space-y-2 text-lg">
          <li>{data.todayCount} appointments</li>
          <li>{data.pendingCount} pending confirmations</li>
          <li>{data.followUpCount} follow-up required</li>
        </ul>
      </section>
      <section className="mt-14">
        <p className="lh-kicker">Schedule</p>
        {!data.today.length ? (
          <EmptyState title="A quiet day." body="No visits are on the book for today." />
        ) : (
          <ol className="mt-5 divide-y divide-line border-t border-line">
            {data.today.map((apt) => (
              <li key={apt.id} className="grid grid-cols-[5rem_1fr_auto] items-baseline gap-4 py-4 text-sm">
                <span className="text-muted">{formatTime(apt.startsAt)}</span>
                <Link to={`/doctor/appointments/${apt.id}`} className="hover:underline">
                  {apt.patient.firstName} {apt.patient.lastName}
                </Link>
                <AppointmentStatus status={apt.status} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
