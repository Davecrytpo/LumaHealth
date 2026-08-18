import { useQuery } from '@tanstack/react-query'
import { json } from '@/lib/api'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

interface Settings {
  environment: string
  maintenance: boolean
  bookingsOpen: boolean
  dataNotice: string
}

export function AdminSettings() {
  const query = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => json.get<Settings>('/api/admin/settings'),
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
        <ErrorState title="We couldn't load system settings." body="Please try again." onRetry={() => void query.refetch()} />
      </div>
    )
  }

  const s = query.data
  return (
    <div className="lh-page max-w-xl">
      <h1 className="lh-display">System</h1>
      <p className="mt-3 text-sm text-muted">Read-only in this environment.</p>
      <dl className="mt-10 space-y-6">
        <div className="border-t border-line pt-4">
          <dt className="text-sm text-muted">Environment</dt>
          <dd className="mt-1 text-sm">{s.environment}</dd>
        </div>
        <div className="border-t border-line pt-4">
          <dt className="text-sm text-muted">Maintenance</dt>
          <dd className="mt-1 text-sm">{s.maintenance ? 'On' : 'Off'}</dd>
        </div>
        <div className="border-t border-line pt-4">
          <dt className="text-sm text-muted">Bookings</dt>
          <dd className="mt-1 text-sm">{s.bookingsOpen ? 'Open' : 'Closed'}</dd>
        </div>
        <div className="border-t border-line pt-4">
          <dt className="text-sm text-muted">Data</dt>
          <dd className="mt-1 text-sm">{s.dataNotice}</dd>
        </div>
      </dl>
    </div>
  )
}
