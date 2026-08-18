import { formatClock } from '@/lib/dates'

export interface TimelineItem {
  id: string
  at: string
  title: string
  body?: string
  unread?: boolean
}

export function Timeline({
  groups,
}: {
  groups: { label: string; items: TimelineItem[] }[]
}) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="lh-kicker">{group.label}</h3>
          <ol className="mt-4 space-y-4">
            {group.items.map((item) => (
              <li key={item.id} className="grid grid-cols-[4.5rem_1fr] gap-4">
                <time className="text-sm text-muted" dateTime={item.at}>
                  {formatClock(item.at)}
                </time>
                <div className="flex items-start gap-3">
                  {item.unread ? (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" aria-label="Unread" />
                  ) : (
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-line" aria-hidden />
                  )}
                  <div>
                    <p className="text-sm text-ink">{item.title}</p>
                    {item.body ? <p className="mt-1 text-sm text-muted">{item.body}</p> : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
