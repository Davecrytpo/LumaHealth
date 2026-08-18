import { forwardRef } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost'
type Size = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lh text-sm font-medium transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        size === 'md' && 'px-4 py-2.5',
        size === 'sm' && 'px-3 py-1.5 text-[13px]',
        variant === 'primary' && 'bg-[var(--lh-btn)] text-[var(--lh-btn-fg)] hover:opacity-90',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:border-ink/30',
        variant === 'tertiary' && 'px-0 text-ink underline-offset-4 hover:text-terracotta hover:underline',
        variant === 'danger' && 'border border-terracotta/40 bg-surface text-terracotta hover:bg-terracotta/10',
        variant === 'ghost' && 'text-muted hover:text-ink',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Working…' : children}
    </button>
  )
})
