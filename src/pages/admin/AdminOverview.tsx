import { useQuery } from '@tanstack/react-query'
import type { AdminOverview as Overview } from '@shared/types'
import { json } from '@/lib/api'
import { formatClock } from '@/lib/dates'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function AdminOverview() {
  const query = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => json.get<Overview>('/api/admin/overview'),
  })

  if (query.isLoading) {
    return (
      <div className="lh-page">
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="lh-page">
        <ErrorState title="We couldn't load the system overview." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const data = query.data
  return (
    <div className="lh-page">
      <p className="lh-kicker">System overview</p>
      <h1 className="lh-display mt-3">The house, at a glance.</h1>
      <dl className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Active patients', data.activePatients],
          ['Clinicians', data.clinicians],
          ['Appointments today', data.appointmentsToday],
          ['Pending actions', data.pendingActions],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-2 font-display text-4xl">{Number(value).toLocaleString()}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-16">
        <p className="lh-kicker">Recent system activity</p>
        <ol className="mt-6 divide-y divide-line border-t border-line">
          {data.activity.map((entry) => (
            <li key={entry.id} className="grid grid-cols-[4rem_1fr] gap-4 py-4 text-sm">
              <time className="text-muted">{formatClock(entry.createdAt)}</time>
              <p>
                {entry.actorName} {entry.action}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
