import { forwardRef, useId } from 'react'
import { cn } from '@/lib/cn'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, id, ...props },
  ref,
) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        className={cn(
          'min-h-28 rounded-lh border bg-surface px-3 py-2 text-sm text-ink',
          error ? 'border-terracotta' : 'border-line',
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-terracotta" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
