import { useQuery } from '@tanstack/react-query'
import type { AuditEntry } from '@shared/types'
import { json } from '@/lib/api'
import { formatClock, formatShortDate } from '@/lib/dates'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function AdminAuditLog() {
  const query = useQuery({
    queryKey: ['admin', 'audit'],
    queryFn: () => json.get<{ items: AuditEntry[] }>('/api/admin/audit-log'),
  })

  return (
    <div className="lh-page">
      <h1 className="lh-display">Audit log</h1>
      <div className="mt-10">
        {query.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <ErrorState title="We couldn't load the audit log." body="Please try again." onRetry={() => void query.refetch()} />
        ) : (
          <ol className="divide-y divide-line border-t border-line">
            {query.data?.items.map((entry) => (
              <li key={entry.id} className="grid grid-cols-[4.5rem_1fr] gap-4 py-4 text-sm">
                <div>
                  <p className="text-muted">{formatClock(entry.createdAt)}</p>
                  <p className="text-xs text-muted">{formatShortDate(entry.createdAt)}</p>
                </div>
                <p>
                  {entry.actorName} {entry.action}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
