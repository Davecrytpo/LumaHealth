import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppointmentStatus as Status, AppointmentView, TimeSlot } from '@shared/types'
import { json } from '@/lib/api'
import { dateKey, formatTime } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { CalendarStrip, TimeSlots } from '@/components/ui/Calendar'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'

type Detail = AppointmentView & { patientAge: number | null }

interface ScheduleResponse {
  date: string
  items: AppointmentView[]
  slots: TimeSlot[]
}

export function DoctorAppointmentDetail() {
  const { id } = useParams()
  const toast = useToast()
  const qc = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [date, setDate] = useState('2026-08-18')
  const [startsAt, setStartsAt] = useState('')
  const query = useQuery({
    queryKey: ['doctor', 'appointment', id],
    queryFn: () => json.get<Detail>(`/api/doctor/appointments/${id}`),
    enabled: Boolean(id),
  })
  const schedule = useQuery({
    queryKey: ['doctor', 'schedule', date],
    queryFn: () => json.get<ScheduleResponse>(`/api/doctor/schedule?date=${date}`),
    enabled: rescheduleOpen,
  })
  const update = useMutation({
    mutationFn: (status: Status) => json.patch(`/api/doctor/appointments/${id}`, { status }),
    onSuccess: () => {
      toast.push('Appointment updated.')
      void qc.invalidateQueries({ queryKey: ['doctor'] })
    },
    onError: () => toast.push('We could not update that appointment.', 'error'),
  })
  const move = useMutation({
    mutationFn: () => json.patch<AppointmentView>(`/api/doctor/appointments/${id}`, { startsAt }),
    onSuccess: () => {
      toast.push('Appointment rescheduled.')
      setRescheduleOpen(false)
      setStartsAt('')
      void qc.invalidateQueries({ queryKey: ['doctor'] })
    },
    onError: () => toast.push('That time is no longer available.', 'error'),
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
        <ErrorState title="We couldn't load this visit." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const apt = query.data
  const canChange = apt.status === 'confirmed' || apt.status === 'pending'

  return (
    <div className="lh-page max-w-xl">
      <Link to="/doctor/schedule" className="text-sm text-muted hover:text-ink">
        ← Schedule
      </Link>
      <section className="mt-8">
        <p className="lh-kicker">Patient</p>
        <h1 className="mt-3 font-display text-4xl">
          {apt.patient.firstName} {apt.patient.lastName}
        </h1>
        <p className="mt-2 text-sm text-muted">{apt.patientAge ? `Age ${apt.patientAge}` : ''}</p>
      </section>
      <section className="mt-10">
        <p className="lh-kicker">Appointment</p>
        <p className="mt-3 text-lg">{formatTime(apt.startsAt)}</p>
        <p className="text-sm text-muted">{apt.type === 'video' ? 'Video consultation' : 'In person'}</p>
      </section>
      <section className="mt-10">
        <p className="lh-kicker">Reason</p>
        <p className="mt-3 text-sm leading-relaxed">{apt.reason}</p>
      </section>
      <div className="mt-10 flex flex-wrap gap-3">
        {canChange ? (
          <>
            {apt.status === 'pending' ? (
              <Button onClick={() => update.mutate('confirmed')}>Start consultation</Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={() => {
                setDate(dateKey(apt.startsAt))
                setStartsAt('')
                setRescheduleOpen(true)
              }}
            >
              Reschedule
            </Button>
            <Button variant="secondary" onClick={() => update.mutate('completed')}>
              Complete
            </Button>
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel
            </Button>
          </>
        ) : null}
        <Link to={`/doctor/patients/${apt.patientId}`}>
          <Button variant="tertiary">Open patient record →</Button>
        </Link>
      </div>

      <Modal
        open={rescheduleOpen}
        title="Choose a new time"
        description={`Move ${apt.patient.firstName} ${apt.patient.lastName} to another open hour.`}
        onClose={() => setRescheduleOpen(false)}
        className="max-w-lg"
      >
        <div className="space-y-5">
          <CalendarStrip start="2026-08-17" days={5} selected={date} onSelect={setDate} />
          {schedule.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : schedule.isError ? (
            <ErrorState title="We couldn't load open hours." body="Please try again." onRetry={() => void schedule.refetch()} />
          ) : (
            <TimeSlots slots={schedule.data?.slots ?? []} selected={startsAt} onSelect={setStartsAt} />
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setRescheduleOpen(false)}>
              Keep this time
            </Button>
            <Button loading={move.isPending} disabled={!startsAt} onClick={() => move.mutate()}>
              Save new time
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={cancelOpen}
        title="Cancel this appointment?"
        description={`This appointment with ${apt.patient.firstName} ${apt.patient.lastName} is scheduled for ${formatTime(apt.startsAt)}.`}
        onClose={() => setCancelOpen(false)}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setCancelOpen(false)}>
            Keep appointment
          </Button>
          <Button
            variant="danger"
            loading={update.isPending}
            onClick={() => {
              update.mutate('cancelled', { onSuccess: () => setCancelOpen(false) })
            }}
          >
            Cancel appointment
          </Button>
        </div>
      </Modal>
    </div>
  )
}
