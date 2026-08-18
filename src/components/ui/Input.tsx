import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
  hideLabel?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, hideLabel, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className={cn('text-[13px] font-medium text-ink', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        className={cn(
          'h-11 rounded-lh border bg-surface px-3 text-sm text-ink placeholder:text-muted/70',
          error ? 'border-terracotta' : 'border-line focus:border-ink/40',
          className,
        )}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
        {...props}
      />
      {hint && !error ? (
        <p id={`${fieldId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-terracotta" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
