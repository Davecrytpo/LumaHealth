import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { PrescriptionView } from '@shared/types'
import { json } from '@/lib/api'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PrescriptionStatusBadge } from '@/components/ui/StatusIndicator'

export function PatientPrescriptions() {
  const query = useQuery({
    queryKey: ['patient', 'prescriptions'],
    queryFn: () => json.get<{ items: PrescriptionView[] }>('/api/patient/prescriptions'),
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Your prescriptions</h1>
      <div className="mt-10">
        {query.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : query.isError ? (
          <ErrorState
            title="We couldn't load your prescriptions."
            body="Your other care information is still available."
            onRetry={() => void query.refetch()}
          />
        ) : !query.data?.items.length ? (
          <EmptyState title="No prescriptions yet." body="When a clinician writes one, it will appear here." />
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {query.data.items.map((rx) => (
              <li key={rx.id} className="py-7">
                <p className="text-[11px] uppercase tracking-[0.16em]">{rx.medication}</p>
                <p className="mt-2 text-sm text-muted">
                  {rx.dosage} · {rx.frequency}
                </p>
                <p className="mt-3 text-sm">Dr. {rx.doctor.lastName}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <PrescriptionStatusBadge status={rx.status} />
                    <span className="text-sm text-muted">
                      {rx.refills} refill{rx.refills === 1 ? '' : 's'} remaining
                    </span>
                  </div>
                  <Link to={`/patient/prescriptions/${rx.id}`} className="text-sm hover:underline">
                    View details →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
