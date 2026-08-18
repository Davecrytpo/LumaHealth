import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block animate-pulse rounded-sm bg-line/80', className)}
      aria-hidden
    />
  )
}

export function SkeletonBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={i === lines - 1 ? 'h-4 w-2/3' : 'h-4 w-full'} />
      ))}
    </div>
  )
}
