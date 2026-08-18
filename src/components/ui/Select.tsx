import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  hideLabel?: boolean
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hideLabel, className, id, options, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className={cn('text-[13px] font-medium text-ink', hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        ref={ref}
        id={fieldId}
        className={cn(
          'h-11 rounded-lh border bg-surface px-3 text-sm text-ink',
          error ? 'border-terracotta' : 'border-line',
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-terracotta" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
