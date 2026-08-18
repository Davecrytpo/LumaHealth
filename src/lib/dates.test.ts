import { describe, expect, it } from 'vitest'
import { formatTime, greetingForHour, relativeDayLabel, groupByDay } from './dates'

describe('dates', () => {
  it('formats a UTC morning time', () => {
    expect(formatTime('2026-08-19T10:30:00.000Z')).toBe('10:30 AM')
  })

  it('uses human relative days', () => {
    expect(relativeDayLabel('2026-08-18T08:42:00.000Z')).toBe('Today')
    expect(relativeDayLabel('2026-08-19T10:30:00.000Z')).toBe('Tomorrow')
    expect(relativeDayLabel('2026-08-17T16:20:00.000Z')).toBe('Yesterday')
  })

  it('greets by hour', () => {
    expect(greetingForHour(8)).toBe('Good morning')
    expect(greetingForHour(14)).toBe('Good afternoon')
    expect(greetingForHour(19)).toBe('Good evening')
  })

  it('groups timeline items by relative day', () => {
    const groups = groupByDay([
      { createdAt: '2026-08-18T08:42:00.000Z' },
      { createdAt: '2026-08-17T16:20:00.000Z' },
    ])
    expect(groups.map((g) => g.label)).toEqual(['TODAY', 'YESTERDAY'])
  })
})
