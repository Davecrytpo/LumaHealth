import { useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/cn'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export function Modal({ open, title, description, onClose, children, className }: ModalProps) {
  const titleId = useId()
  const descId = useId()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const focusable = [
        ...ref.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ),
      ]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 md:items-center md:px-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-dark/40"
        onClick={onClose}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-md border border-line bg-surface p-5 shadow-lh md:p-6',
          'rounded-t-xl md:rounded-none',
          'max-h-[92vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          className,
        )}
      >
        <h2 id={titleId} className="font-display text-2xl text-ink">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-2 text-sm leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
