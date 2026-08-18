import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentView, PatientOverview as Overview } from '@shared/types'
import { json } from '@/lib/api'
import { formatTime, greetingForHour, relativeDayLabel } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Timeline } from '@/components/ui/Timeline'
import { groupByDay } from '@/lib/dates'
import { useAuth } from '@/context/AuthContext'

export function PatientOverview() {
  const { user } = useAuth()
  const overview = useQuery({
    queryKey: ['patient', 'overview'],
    queryFn: () => json.get<Overview>('/api/patient/overview'),
  })
  const appointments = useQuery({
    queryKey: ['patient', 'appointments', 'upcoming'],
    queryFn: () => json.get<{ items: AppointmentView[] }>('/api/patient/appointments?tab=upcoming'),
  })

  if (overview.isLoading && appointments.isLoading && !overview.data) {
    return (
      <div className="lh-page space-y-8">
        <div>
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-3 h-4 w-80" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    )
  }

  const data = overview.data
  const greetingName = data?.greetingName ?? user?.firstName ?? 'there'
  const next = appointments.data?.items[0] ?? null

  return (
    <div className="lh-page">
      <header>
        <h1 className="lh-display">
          {greetingForHour()}, {greetingName}.
        </h1>
        <p className="mt-2 text-sm text-muted md:mt-3">Here’s what needs your attention today.</p>
      </header>

      <div className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1.35fr_0.85fr] lg:gap-10">
        <section>
          <p className="lh-kicker">Next appointment</p>
          {appointments.isLoading ? (
            <Skeleton className="mt-5 h-40 w-full" />
          ) : appointments.isError ? (
            <div className="mt-5">
              <ErrorState
                kicker="Your appointments"
                title="We couldn't load your appointments."
                body="Your other care information is still available."
                onRetry={() => void appointments.refetch()}
              />
            </div>
          ) : next ? (
            <div className="mt-5">
              <p className="font-display text-4xl md:text-5xl">{relativeDayLabel(next.startsAt)}</p>
              <p className="mt-1 font-display text-4xl md:text-5xl">{formatTime(next.startsAt)}</p>
              <p className="mt-6 text-sm">
                Dr. {next.doctor.firstName} {next.doctor.lastName}
              </p>
              <p className="text-sm text-muted">
                {next.doctor.specialty} · {next.type === 'video' ? 'Video consultation' : 'In person'}
              </p>
              <div className="mt-6">
                <Link to={`/patient/appointments/${next.id}`}>
                  <Button variant="secondary">View appointment</Button>
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              title="Your calendar is clear."
              body="You don’t have any upcoming appointments."
              action={{ label: 'Find a clinician', to: '/patient/find-care' }}
            />
          )}
        </section>

        <aside>
          <p className="lh-kicker">Care signal</p>
          {overview.isError ? (
            <p className="mt-5 text-sm text-muted">Care updates will return when the connection does.</p>
          ) : data?.careSignal ? (
            <div className="mt-5">
              <p className="text-lg">{data.careSignal.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{data.careSignal.body}</p>
              <Link to={data.careSignal.href} className="mt-4 inline-block text-sm hover:underline">
                View prescription →
              </Link>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">Nothing waiting on a refill.</p>
          )}
        </aside>
      </div>

      <section className="mt-12 border-t border-line pt-8 md:mt-16 md:border-0 md:pt-0">
        <p className="lh-kicker">Your week</p>
        {overview.isError ? (
          <p className="mt-5 text-sm text-muted">The week view is waiting on the same connection.</p>
        ) : (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {(data?.week ?? []).map((day) => (
              <div key={day.date} className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{day.weekday}</p>
                <p className="mt-1 truncate text-[13px] tabular-nums">
                  {day.slots[0] ? (
                    <>
                      <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-terracotta align-middle" />
                      {day.slots[0].time}
                    </>
                  ) : (
                    <span className="text-line">—</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 md:mt-16">
        <p className="lh-kicker">Recent activity</p>
        <div className="mt-6">
          {overview.isError ? (
            <p className="text-sm text-muted">Recent activity will appear again shortly.</p>
          ) : (
            <Timeline
              groups={groupByDay(data?.activity ?? []).map((g) => ({
                label: g.label,
                items: g.items.map((n) => ({
                  id: n.id,
                  at: n.createdAt,
                  title: n.title,
                  unread: !n.read,
                })),
              }))}
            />
          )}
        </div>
      </section>
    </div>
  )
}
