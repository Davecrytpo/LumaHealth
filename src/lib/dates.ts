const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function parseIso(iso: string) {
  return new Date(iso)
}

export function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function formatTime(iso: string) {
  const d = parseIso(iso)
  const hours = d.getUTCHours()
  const minutes = pad(d.getUTCMinutes())
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const h = hours % 12 || 12
  return `${h}:${minutes} ${suffix}`
}

export function formatDay(iso: string) {
  const d = parseIso(iso)
  return `${WEEKDAYS[d.getUTCDay()]}`
}

export function formatLongDate(iso: string) {
  const d = parseIso(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`
}

export function formatFullDate(iso: string) {
  const d = parseIso(iso)
  return `${WEEKDAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

export function formatShortDate(iso: string) {
  const d = parseIso(iso)
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]?.slice(0, 3)}`
}

export function formatClock(iso: string) {
  const d = parseIso(iso)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export function relativeDayLabel(iso: string, today = '2026-08-18') {
  const date = iso.slice(0, 10)
  if (date === today) return 'Today'
  const t = new Date(`${today}T00:00:00.000Z`)
  const n = new Date(`${date}T00:00:00.000Z`)
  const diff = Math.round((n.getTime() - t.getTime()) / 86_400_000)
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return formatDay(iso)
}

export function groupByDay<T extends { createdAt?: string; startsAt?: string }>(
  items: T[],
  field: 'createdAt' | 'startsAt' = 'createdAt',
) {
  const groups: { label: string; items: T[] }[] = []
  for (const item of items) {
    const iso = item[field]
    if (!iso) continue
    const label = relativeDayLabel(iso).toUpperCase()
    const existing = groups.find((g) => g.label === label)
    if (existing) existing.items.push(item)
    else groups.push({ label, items: [item] })
  }
  return groups
}

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function weekdayShort(iso: string) {
  return WEEKDAYS_SHORT[parseIso(iso).getUTCDay()] ?? ''
}

export function monthName(iso: string) {
  return MONTHS[parseIso(iso).getUTCMonth()] ?? ''
}

export function dateKey(iso: string) {
  return iso.slice(0, 10)
}

export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
