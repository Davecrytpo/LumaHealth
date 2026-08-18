import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { json } from '@/lib/api'
import { formatShortDate } from '@/lib/dates'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

interface PatientRow {
  id: string
  firstName: string
  lastName: string
  lastVisit: string | null
}

export function DoctorPatients() {
  const [q, setQ] = useState('')
  const query = useQuery({
    queryKey: ['doctor', 'patients', q],
    queryFn: () => json.get<{ items: PatientRow[] }>(`/api/doctor/patients?q=${encodeURIComponent(q)}`),
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Patients</h1>
      <div className="mt-8 max-w-md">
        <Input label="Search patients" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="mt-10">
        {query.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : query.isError ? (
          <ErrorState title="We couldn't load your patients." body="Please try again." onRetry={() => void query.refetch()} />
        ) : !query.data?.items.length ? (
          <EmptyState title="No patients match." body="Try another name." />
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {query.data.items.map((p) => (
              <li key={p.id} className="py-5">
                <Link to={`/doctor/patients/${p.id}`} className="block">
                  <p className="text-sm">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Last visit · {p.lastVisit ? formatShortDate(p.lastVisit) : '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
