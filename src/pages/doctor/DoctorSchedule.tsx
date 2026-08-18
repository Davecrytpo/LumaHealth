import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { AppointmentView, TimeSlot } from '@shared/types'
import { json } from '@/lib/api'
import { formatClock, formatLongDate, formatDay } from '@/lib/dates'
import { CalendarStrip } from '@/components/ui/Calendar'
import { AppointmentStatus } from '@/components/ui/StatusIndicator'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'

interface ScheduleResponse {
  date: string
  items: AppointmentView[]
  slots: TimeSlot[]
}

export function DoctorSchedule() {
  const [date, setDate] = useState('2026-08-18')
  const query = useQuery({
    queryKey: ['doctor', 'schedule', date],
    queryFn: () => json.get<ScheduleResponse>(`/api/doctor/schedule?date=${date}`),
  })

  const hours = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30']

  return (
    <div className="lh-page">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="lh-kicker">{formatDay(`${date}T00:00:00.000Z`).slice(0, 3).toUpperCase()}</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{date.slice(8)}</h1>
          <p className="mt-2 text-sm text-muted">{formatLongDate(`${date}T00:00:00.000Z`)}</p>
        </div>
        <CalendarStrip start="2026-08-17" days={7} selected={date} onSelect={setDate} />
      </div>
      <div className="mt-10">
        {query.isLoading ? (
          <Skeleton className="h-80 w-full" />
        ) : query.isError || !query.data ? (
          <ErrorState title="We couldn't load the schedule." body="Please try again." onRetry={() => void query.refetch()} />
        ) : (
          <ol>
            {hours.map((hour) => {
              const apt = query.data.items.find((a) => formatClock(a.startsAt) === hour)
              return (
                <li
                  key={hour}
                  className={cn(
                    'grid grid-cols-[3.75rem_1fr] items-center border-t border-line py-2.5 text-sm md:grid-cols-[4.5rem_1fr] md:py-3',
                    apt?.status === 'cancelled' && 'opacity-40',
                    apt?.status === 'pending' && 'bg-honey/5',
                    apt?.status === 'completed' && 'text-muted',
                  )}
                >
                  <span className="text-muted">{hour}</span>
                  {apt ? (
                    <Link to={`/doctor/appointments/${apt.id}`} className="flex items-center justify-between gap-3">
                      <span>
                        {apt.patient.firstName} {apt.patient.lastName}
                      </span>
                      <AppointmentStatus status={apt.status} />
                    </Link>
                  ) : (
                    <span className="text-line">─────────────</span>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
