import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export function Dropdown({
  label,
  children,
}: {
  label: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="text-sm text-ink"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      <div
        role="menu"
        className={cn(
          'absolute right-0 top-full z-30 mt-2 min-w-44 border border-line bg-surface py-1 shadow-lh',
          open ? 'block' : 'hidden',
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-canvas"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
