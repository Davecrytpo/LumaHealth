import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { AppointmentView, ClinicianCard, ConsultationType, TimeSlot } from '@shared/types'
import { json } from '@/lib/api'
import { dateKey, formatFullDate, formatTime } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { CalendarStrip, TimeSlots } from '@/components/ui/Calendar'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/api'
import { cn } from '@/lib/cn'

interface LocationState {
  startsAt?: string
  doctor?: ClinicianCard
  rescheduleId?: string
}

type ClinicianDetail = ClinicianCard & { slots: TimeSlot[] }

export function BookingFlow() {
  const { doctorId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const state = (location.state as LocationState | null) ?? {}
  const rescheduleId = state.rescheduleId ?? params.get('reschedule') ?? undefined
  const [startsAt, setStartsAt] = useState(state.startsAt ?? '')
  const [step, setStep] = useState(state.startsAt ? 2 : 1)
  const [type, setType] = useState<ConsultationType>('video')
  const [reason, setReason] = useState('')
  const [selectedDate, setSelectedDate] = useState(state.startsAt ? dateKey(state.startsAt) : '2026-08-17')

  const clinician = useQuery({
    queryKey: ['clinician', doctorId],
    queryFn: () => json.get<ClinicianDetail>(`/api/patient/clinicians/${doctorId}`),
    enabled: Boolean(doctorId),
  })
  const existing = useQuery({
    queryKey: ['patient', 'appointment', rescheduleId],
    queryFn: () => json.get<AppointmentView>(`/api/patient/appointments/${rescheduleId}`),
    enabled: Boolean(rescheduleId),
  })

  const doctor = clinician.data ?? state.doctor
  const offeredTypes = (doctor?.consultationTypes?.length
    ? doctor.consultationTypes
    : (['video', 'in-person'] as const)) as ConsultationType[]

  useEffect(() => {
    if (existing.data) {
      setType(existing.data.type)
      setReason(existing.data.reason)
    }
  }, [existing.data])

  useEffect(() => {
    const types = clinician.data?.consultationTypes
    if (types?.length && !types.includes(type) && types[0]) setType(types[0])
  }, [clinician.data, type])

  const daySlots = useMemo(
    () => clinician.data?.slots.filter((s) => dateKey(s.startsAt) === selectedDate) ?? [],
    [clinician.data, selectedDate],
  )

  const book = useMutation({
    mutationFn: () =>
      rescheduleId
        ? json.patch<AppointmentView>(`/api/patient/appointments/${rescheduleId}`, { startsAt, type, reason })
        : json.post<AppointmentView>('/api/patient/appointments', {
            doctorId,
            startsAt,
            type,
            reason,
          }),
    onSuccess: (apt) => {
      toast.push(rescheduleId ? 'Appointment rescheduled.' : 'Appointment confirmed.')
      navigate(`/patient/appointments/${apt.id}/confirmed`, { state: { appointment: apt } })
    },
    onError: (err) => {
      toast.push(err instanceof ApiError ? err.message : 'We could not confirm that appointment. Please try again.', 'error')
    },
  })

  if (clinician.isLoading && !doctor) {
    return (
      <div className="lh-page">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  if (clinician.isError && !doctor) {
    return (
      <div className="lh-page">
        <ErrorState
          title="We couldn't load this booking."
          body="Return to the clinician list and try again."
          onRetry={() => void clinician.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="lh-page max-w-xl">
      <Link to={`/patient/find-care/${doctorId}`} className="text-sm text-muted hover:text-ink">
        ← Choose clinician
      </Link>
      {doctor ? (
        <p className="mt-6 text-sm">
          Dr. {doctor.firstName} {doctor.lastName}
          <span className="text-muted"> · {doctor.specialty}</span>
        </p>
      ) : null}
      <p className="mt-8 lh-kicker">Step {step} of 3</p>
      {step === 1 && (
        <div className="mt-4">
          <h1 className="lh-display">Choose a time</h1>
          <div className="mt-8">
            <CalendarStrip start="2026-08-17" days={5} selected={selectedDate} onSelect={setSelectedDate} />
          </div>
          <div className="mt-6">
            <p className="mb-3 text-sm">Available times</p>
            <TimeSlots
              slots={daySlots}
              selected={startsAt}
              onSelect={setStartsAt}
            />
          </div>
          <div className="mt-8">
            <Button disabled={!startsAt} onClick={() => setStep(2)}>
              Continue →
            </Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <form
          className="mt-4 space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            setStep(3)
          }}
        >
          <h1 className="lh-display">Appointment details</h1>
          <fieldset className="space-y-2">
            <legend className="text-[13px] font-medium">Consultation type</legend>
            {offeredTypes.map((opt) => (
              <label
                key={opt}
                className={cn(
                  'flex items-center gap-3 border px-4 py-3 text-sm',
                  type === opt ? 'border-ink' : 'border-line',
                )}
              >
                <input type="radio" name="type" checked={type === opt} onChange={() => setType(opt)} />
                {opt === 'video' ? 'Video' : 'In person'}
              </label>
            ))}
          </fieldset>
          <Textarea
            label="Reason for visit"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            minLength={3}
          />
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="submit">Review →</Button>
          </div>
        </form>
      )}
      {step === 3 && (
        <div className="mt-4">
          <h1 className="lh-display">Review</h1>
          <p className="mt-8 text-lg">
            {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Your clinician'}
          </p>
          <p className="text-sm text-muted">{doctor?.specialty}</p>
          <p className="mt-6 font-display text-3xl">{formatFullDate(startsAt)}</p>
          <p className="mt-1 font-display text-3xl">{formatTime(startsAt)}</p>
          <p className="mt-4 text-sm text-muted">{type === 'video' ? 'Video consultation' : 'In person'}</p>
          <p className="mt-2 text-sm text-muted">{reason}</p>
          <div className="mt-8 flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button loading={book.isPending} disabled={!startsAt} onClick={() => book.mutate()}>
              Confirm appointment →
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
