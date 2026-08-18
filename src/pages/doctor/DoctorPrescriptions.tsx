import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { PrescriptionView } from '@shared/types'
import { json } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PrescriptionStatusBadge } from '@/components/ui/StatusIndicator'

export function DoctorPrescriptions() {
  const query = useQuery({
    queryKey: ['doctor', 'prescriptions'],
    queryFn: () => json.get<{ items: PrescriptionView[] }>('/api/doctor/prescriptions'),
  })

  return (
    <div className="lh-page">
      <div className="flex items-end justify-between gap-4">
        <h1 className="lh-display">Prescriptions</h1>
        <Link to="/doctor/prescriptions/new">
          <Button>Create prescription →</Button>
        </Link>
      </div>
      <div className="mt-10">
        {query.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : query.isError ? (
          <ErrorState title="We couldn't load prescriptions." body="Please try again." onRetry={() => void query.refetch()} />
        ) : !query.data?.items.length ? (
          <EmptyState title="None issued yet." body="New prescriptions will appear here." />
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {query.data.items.map((rx) => (
              <li key={rx.id} className="flex flex-wrap items-baseline justify-between gap-3 py-5">
                <div>
                  <p className="text-sm">{rx.medication}</p>
                  <p className="mt-1 text-sm text-muted">
                    {rx.patient.firstName} {rx.patient.lastName} · {rx.dosage}
                  </p>
                </div>
                <PrescriptionStatusBadge status={rx.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
