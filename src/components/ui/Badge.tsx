import { cn } from '@/lib/cn'

const tones = {
  confirmed: 'text-sage',
  pending: 'text-honey',
  completed: 'text-muted',
  cancelled: 'text-terracotta',
  active: 'text-sage',
  verified: 'text-sage',
  rejected: 'text-terracotta',
  suspended: 'text-terracotta',
  invited: 'text-honey',
} as const

export function Badge({
  label,
  tone = 'completed',
}: {
  label: string
  tone?: keyof typeof tones
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em]', tones[tone])}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}
