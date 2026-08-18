import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentView } from '@shared/types'
import { json } from '@/lib/api'
import { formatLongDate, formatTime, formatDay } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'

export function BookingConfirmation() {
  const { id } = useParams()
  const location = useLocation()
  const seeded = (location.state as { appointment?: AppointmentView } | null)?.appointment
  const query = useQuery({
    queryKey: ['patient', 'appointment', id],
    queryFn: () => json.get<AppointmentView>(`/api/patient/appointments/${id}`),
    enabled: Boolean(id) && !seeded,
    initialData: seeded,
  })
  const apt = query.data

  if (query.isError && !apt) {
    return (
      <div className="lh-page">
        <ErrorState
          title="We couldn't load that confirmation."
          body="Your appointment may still be on the calendar."
          onRetry={() => void query.refetch()}
        />
      </div>
    )
  }

  if (!apt) {
    return (
      <div className="lh-page">
        <Skeleton className="h-10 w-64" />
      </div>
    )
  }

  return (
    <div className="lh-page max-w-lg">
      <h1 className="lh-display-lg">You’re on the calendar.</h1>
      <p className="mt-8 font-display text-3xl md:mt-12 md:text-4xl">{formatDay(apt.startsAt)}</p>
      <p className="font-display text-3xl md:text-4xl">{formatLongDate(apt.startsAt)}</p>
      <p className="mt-4 font-display text-3xl md:mt-6 md:text-4xl">{formatTime(apt.startsAt)}</p>
      <p className="mt-8 text-sm">
        Dr. {apt.doctor.firstName} {apt.doctor.lastName}
      </p>
      <p className="text-sm text-muted">{apt.doctor.specialty}</p>
      <p className="mt-2 text-sm text-muted">{apt.type === 'video' ? 'Video consultation' : 'In person'}</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={`/patient/appointments/${apt.id}`}>
          <Button>View appointment</Button>
        </Link>
        <Link to="/patient">
          <Button variant="secondary">Back to overview</Button>
        </Link>
      </div>
    </div>
  )
}
