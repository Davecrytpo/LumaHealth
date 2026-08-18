import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppointmentView } from '@shared/types'
import { json } from '@/lib/api'
import { formatFullDate, formatTime } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { AppointmentStatus } from '@/components/ui/StatusIndicator'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/context/ToastContext'

export function PatientAppointmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const query = useQuery({
    queryKey: ['patient', 'appointment', id],
    queryFn: () => json.get<AppointmentView>(`/api/patient/appointments/${id}`),
    enabled: Boolean(id),
  })
  const cancel = useMutation({
    mutationFn: () => json.patch(`/api/patient/appointments/${id}`, { status: 'cancelled' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['patient'] })
      toast.push('This appointment has been cancelled.')
      setCancelOpen(false)
      navigate('/patient/appointments')
    },
    onError: () => toast.push('We could not cancel that appointment. Please try again.', 'error'),
  })

  if (query.isLoading) {
    return (
      <div className="lh-page space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="lh-page">
        <ErrorState
          title="We couldn't load this appointment."
          body="It may have been removed, or the connection dropped."
          onRetry={() => void query.refetch()}
        />
      </div>
    )
  }

  const apt = query.data
  const canJoin = apt.status === 'confirmed' && apt.type === 'video'
  const canChange = apt.status === 'confirmed' || apt.status === 'pending'

  return (
    <div className="lh-page">
      <Link to="/patient/appointments" className="text-sm text-muted hover:text-ink">
        ← Appointments
      </Link>
      <div className="mt-8">
        <AppointmentStatus status={apt.status} />
      </div>
      <h1 className="mt-4 font-display text-4xl">
        Dr. {apt.doctor.firstName} {apt.doctor.lastName}
      </h1>
      <p className="mt-2 text-muted">{apt.doctor.specialty}</p>
      <p className="mt-8 text-lg">
        {formatFullDate(apt.startsAt)} · {formatTime(apt.startsAt)}
      </p>
      <p className="mt-2 text-sm text-muted">
        {apt.type === 'video' ? 'Video consultation' : 'In person'} · {apt.reason}
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        {canJoin ? <Button onClick={() => setJoinOpen(true)}>Join appointment</Button> : null}
        {canChange ? (
          <>
            <Link
              to={`/patient/find-care/${apt.doctorId}/book?reschedule=${apt.id}`}
              state={{ rescheduleId: apt.id, doctor: apt.doctor }}
            >
              <Button variant="secondary">Reschedule</Button>
            </Link>
            <Button variant="danger" onClick={() => setCancelOpen(true)}>
              Cancel
            </Button>
          </>
        ) : null}
      </div>
      <Modal
        open={joinOpen}
        title="Your visit is on the calendar."
        description={`The waiting room for this video visit with Dr. ${apt.doctor.lastName} opens at ${formatTime(apt.startsAt)} on ${formatFullDate(apt.startsAt)}.`}
        onClose={() => setJoinOpen(false)}
      >
        <Button onClick={() => setJoinOpen(false)}>Back to appointment</Button>
      </Modal>
      <Modal
        open={cancelOpen}
        title="Cancel this appointment?"
        description={`This appointment with Dr. ${apt.doctor.lastName} is scheduled for ${formatFullDate(apt.startsAt)} at ${formatTime(apt.startsAt)}.`}
        onClose={() => setCancelOpen(false)}
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setCancelOpen(false)}>
            Keep appointment
          </Button>
          <Button variant="danger" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Cancel appointment
          </Button>
        </div>
      </Modal>
    </div>
  )
}
