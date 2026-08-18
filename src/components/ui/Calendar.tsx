import { cn } from '@/lib/cn'
import { addDays, dateKey, monthName, weekdayShort } from '@/lib/dates'

export function CalendarStrip({
  start,
  days = 5,
  selected,
  onSelect,
}: {
  start: string
  days?: number
  selected: string
  onSelect: (date: string) => void
}) {
  const items = Array.from({ length: days }, (_, i) => addDays(start, i))
  return (
    <div>
      <p className="lh-kicker">{monthName(`${start}T00:00:00.000Z`).toUpperCase()}</p>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {items.map((date) => {
          const iso = `${date}T00:00:00.000Z`
          const active = date === selected
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              className={cn(
                'flex h-14 min-w-[3rem] flex-1 flex-col items-center justify-center rounded-lh border text-sm md:h-16 md:min-w-[3.5rem]',
                active
                  ? 'border-ink bg-[var(--lh-btn)] text-[var(--lh-btn-fg)]'
                  : 'border-line bg-surface text-ink hover:border-ink/30',
              )}
              aria-pressed={active}
            >
              <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">
                {weekdayShort(iso)}
              </span>
              <span className="mt-1 text-base">{Number(date.slice(8))}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TimeSlots({
  slots,
  selected,
  onSelect,
}: {
  slots: { startsAt: string; available: boolean }[]
  selected?: string
  onSelect: (startsAt: string) => void
}) {
  if (slots.length === 0) {
    return <p className="text-sm text-muted">No times published for this day.</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const time = slot.startsAt.slice(11, 16)
        const active = selected === slot.startsAt
        return (
          <button
            key={slot.startsAt}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelect(slot.startsAt)}
            className={cn(
              'min-h-11 min-w-[4.75rem] flex-1 rounded-lh border px-3 py-2.5 text-sm',
              !slot.available && 'cursor-not-allowed border-line text-muted/50 line-through',
              slot.available && active && 'border-ink bg-[var(--lh-btn)] text-[var(--lh-btn-fg)]',
              slot.available && !active && 'border-line bg-surface text-ink hover:border-ink/30',
            )}
          >
            {time}
          </button>
        )
      })}
    </div>
  )
}

export { dateKey }
