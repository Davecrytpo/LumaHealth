import { Link } from 'react-router-dom'
import { Button } from './Button'

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: { label: string; onClick?: () => void; to?: string }
}) {
  return (
    <div className="py-10">
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      {action ? (
        <div className="mt-6">
          {action.to ? (
            <Link to={action.to}>
              <Button>{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
