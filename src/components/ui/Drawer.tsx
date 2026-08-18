import { useEffect } from 'react'
import { cn } from '@/lib/cn'

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-40 transition',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <button
        type="button"
        aria-label="Close panel"
        className={cn('absolute inset-0 bg-dark/30 transition', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-md border-l border-line bg-surface p-6 transition-transform',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <h2 className="font-display text-2xl">{title}</h2>
        <div className="mt-6">{children}</div>
      </aside>
    </div>
  )
}
