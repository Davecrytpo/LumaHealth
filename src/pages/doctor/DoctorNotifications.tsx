import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification } from '@shared/types'
import { json } from '@/lib/api'
import { groupByDay } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Timeline } from '@/components/ui/Timeline'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function DoctorNotifications() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['doctor', 'notifications'],
    queryFn: () => json.get<{ items: AppNotification[] }>('/api/doctor/notifications'),
  })
  const mark = useMutation({
    mutationFn: () => json.post('/api/doctor/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['doctor', 'notifications'] }),
  })

  return (
    <div className="lh-page">
      <div className="flex items-end justify-between">
        <h1 className="lh-display">Updates</h1>
        <Button variant="tertiary" onClick={() => mark.mutate()}>
          Mark all as read
        </Button>
      </div>
      <div className="mt-10">
        {query.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : query.isError ? (
          <ErrorState title="We couldn't load updates." body="Please try again." onRetry={() => void query.refetch()} />
        ) : !query.data?.items.length ? (
          <EmptyState title="Nothing waiting." body="New bookings and renewals will appear here." />
        ) : (
          <Timeline
            groups={groupByDay(query.data.items).map((g) => ({
              label: g.label,
              items: g.items.map((n) => ({
                id: n.id,
                at: n.createdAt,
                title: n.title,
                body: n.body,
                unread: !n.read,
              })),
            }))}
          />
        )}
      </div>
    </div>
  )
}
