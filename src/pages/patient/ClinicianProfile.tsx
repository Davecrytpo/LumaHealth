import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ClinicianCard, TimeSlot } from '@shared/types'
import { json } from '@/lib/api'
import { dateKey } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { CalendarStrip, TimeSlots } from '@/components/ui/Calendar'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

type ClinicianDetail = ClinicianCard & { slots: TimeSlot[] }

export function ClinicianProfile() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState('2026-08-19')
  const [selectedSlot, setSelectedSlot] = useState<string>()
  const query = useQuery({
    queryKey: ['clinician', doctorId],
    queryFn: () => json.get<ClinicianDetail>(`/api/patient/clinicians/${doctorId}`),
    enabled: Boolean(doctorId),
  })

  const daySlots = useMemo(
    () => query.data?.slots.filter((s) => dateKey(s.startsAt) === selectedDate) ?? [],
    [query.data, selectedDate],
  )

  if (query.isLoading) {
    return (
      <div className="lh-page space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="lh-page">
        <ErrorState
          title="We couldn't load this clinician."
          body="They may no longer be accepting visits."
          onRetry={() => void query.refetch()}
        />
      </div>
    )
  }

  const doc = query.data

  return (
    <div className="lh-page">
      <Link to="/patient/find-care" className="text-sm text-muted hover:text-ink">
        ← Back to clinicians
      </Link>
      <h1 className="mt-6 font-display text-4xl">
        Dr. {doc.firstName} {doc.lastName}
      </h1>
      <p className="mt-2 text-muted">{doc.specialty}</p>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <div className="space-y-8">
          <section>
            <p className="lh-kicker">About</p>
            <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{doc.bio}</p>
          </section>
          <section>
            <p className="lh-kicker">Experience</p>
            <p className="mt-3 text-sm">{doc.yearsExperience} years</p>
          </section>
          <section>
            <p className="lh-kicker">Languages</p>
            <p className="mt-3 text-sm">{doc.languages.join(' · ')}</p>
          </section>
          <section>
            <p className="lh-kicker">Consultation types</p>
            <p className="mt-3 text-sm">
              {doc.consultationTypes.map((t) => (t === 'video' ? 'Video' : 'In person')).join(' · ')}
            </p>
          </section>
        </div>
        <div>
          <p className="lh-kicker">Availability</p>
          <div className="mt-5">
            <CalendarStrip start="2026-08-17" days={5} selected={selectedDate} onSelect={setSelectedDate} />
          </div>
          <div className="mt-6">
            <TimeSlots slots={daySlots} selected={selectedSlot} onSelect={setSelectedSlot} />
          </div>
          <div className="mt-8">
            <Button
              disabled={!selectedSlot}
              onClick={() =>
                navigate(`/patient/find-care/${doc.id}/book`, {
                  state: { startsAt: selectedSlot, doctor: doc },
                })
              }
            >
              Continue to booking →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
