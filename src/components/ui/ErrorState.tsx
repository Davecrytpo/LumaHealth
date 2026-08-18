import { Button } from './Button'

export function ErrorState({
  kicker = 'Something went wrong',
  title,
  body,
  onRetry,
}: {
  kicker?: string
  title: string
  body: string
  onRetry?: () => void
}) {
  return (
    <div className="border border-line bg-surface px-5 py-6" role="alert">
      <p className="lh-kicker">{kicker}</p>
      <h2 className="mt-3 font-display text-2xl text-ink">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{body}</p>
      {onRetry ? (
        <div className="mt-5">
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  )
}
