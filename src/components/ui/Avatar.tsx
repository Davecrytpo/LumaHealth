import { cn } from '@/lib/cn'

export function Avatar({
  name,
  size = 'md',
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-sage-soft text-ink',
        size === 'sm' && 'h-8 w-8 text-[11px]',
        size === 'md' && 'h-10 w-10 text-xs',
        size === 'lg' && 'h-14 w-14 text-sm',
      )}
    >
      {initials}
    </span>
  )
}
