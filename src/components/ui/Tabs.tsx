import { cn } from '@/lib/cn'

export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (value: T) => void
  items: { value: T; label: string }[]
}) {
  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const index = items.findIndex((item) => item.value === value)
    if (index < 0) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      onChange(items[(index + 1) % items.length]!.value)
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      onChange(items[(index - 1 + items.length) % items.length]!.value)
    }
    if (e.key === 'Home') {
      e.preventDefault()
      onChange(items[0]!.value)
    }
    if (e.key === 'End') {
      e.preventDefault()
      onChange(items[items.length - 1]!.value)
    }
  }

  return (
    <div role="tablist" className="flex gap-6 border-b border-line" onKeyDown={onKeyDown}>
      {items.map((item) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            className={cn(
              '-mb-px border-b-2 pb-3 text-sm',
              selected ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
