import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification } from '@shared/types'
import { json } from '@/lib/api'
import { groupByDay } from '@/lib/dates'
import { Button } from '@/components/ui/Button'
import { Timeline } from '@/components/ui/Timeline'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'

export function PatientNotifications() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: ['patient', 'notifications'],
    queryFn: () => json.get<{ items: AppNotification[] }>('/api/patient/notifications'),
  })
  const mark = useMutation({
    mutationFn: () => json.post('/api/patient/notifications/read-all'),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['patient', 'notifications'] }),
  })

  return (
    <div className="lh-page">
      <div className="flex items-end justify-between gap-4">
        <h1 className="lh-display">Updates</h1>
        <Button variant="tertiary" onClick={() => mark.mutate()} disabled={mark.isPending}>
          Mark all as read
        </Button>
      </div>
      <div className="mt-10">
        {query.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : query.isError ? (
          <ErrorState
            title="We couldn't load your updates."
            body="Please try again."
            onRetry={() => void query.refetch()}
          />
        ) : !query.data?.items.length ? (
          <EmptyState title="You're all caught up." body="New care updates will appear here." />
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
