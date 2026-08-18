import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { PrescriptionView } from '@shared/types'
import { json } from '@/lib/api'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatShortDate } from '@/lib/dates'

export function PrescriptionDetail() {
  const { id } = useParams()
  const query = useQuery({
    queryKey: ['patient', 'prescription', id],
    queryFn: () => json.get<PrescriptionView>(`/api/patient/prescriptions/${id}`),
    enabled: Boolean(id),
  })

  if (query.isLoading) {
    return (
      <div className="lh-page">
        <Skeleton className="h-12 w-56" />
      </div>
    )
  }
  if (query.isError || !query.data) {
    return (
      <div className="lh-page">
        <ErrorState
          title="We couldn't load this prescription."
          body="Please try again."
          onRetry={() => void query.refetch()}
        />
      </div>
    )
  }

  const rx = query.data
  return (
    <div className="lh-page">
      <Link to="/patient/prescriptions" className="text-sm text-muted hover:text-ink">
        ← Prescriptions
      </Link>
      <h1 className="lh-display-lg mt-6">{rx.medication}</h1>
      <p className="mt-3 text-sm text-muted">Prescribed by Dr. {rx.doctor.lastName}</p>
      <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ['Dosage', rx.dosage],
          ['Frequency', rx.frequency],
          ['Started', formatShortDate(`${rx.startDate}T00:00:00.000Z`)],
          ['Ends', formatShortDate(`${rx.endDate}T00:00:00.000Z`)],
          ['Refills', String(rx.refills)],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="lh-kicker">{k}</dt>
            <dd className="mt-2 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-16">
        <p className="lh-kicker">Instructions</p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">{rx.instructions}</p>
      </section>
      <section className="mt-16">
        <p className="lh-kicker">Medication timeline</p>
        <div className="mt-5 h-px w-full bg-line">
          <div className="relative -top-1 h-2 w-2/3 bg-terracotta/70" />
        </div>
        <div className="mt-3 flex justify-between text-xs text-muted">
          <span>{rx.startDate}</span>
          <span>{rx.endDate}</span>
        </div>
      </section>
    </div>
  )
}
