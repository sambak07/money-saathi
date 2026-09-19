import { describe, expect, it } from 'vitest'
import { buildReminders, defaultReminderSettings, monthLongLabel } from './reminders'
import type { Budget } from './planning'

describe('reminder month labels are timezone-independent', () => {
  it('maps every YYYY-MM to its correct long month name', () => {
    const cases: Array<[string, string]> = [
      ['2026-01', 'January'],
      ['2026-02', 'February'],
      ['2026-03', 'March'],
      ['2026-09', 'September'],
      ['2026-12', 'December'],
    ]
    for (const [month, label] of cases) expect(monthLongLabel(month)).toBe(label)
  })

  it('accepts a full YYYY-MM-DD string and still reads the month field only', () => {
    expect(monthLongLabel('2026-09-01')).toBe('September')
    expect(monthLongLabel('2026-01-31')).toBe('January')
  })

  it('does not depend on Date parsing: the label is derived purely from the string', () => {
    // A YYYY-MM-DD parsed via `new Date(...)` uses UTC midnight, which in a
    // negative-offset timezone would locally fall on the previous month. The
    // label must not shift regardless of the runtime timezone.
    const original = process.env.TZ
    try {
      for (const tz of ['UTC', 'America/Los_Angeles', 'Pacific/Honolulu', 'Asia/Thimphu']) {
        process.env.TZ = tz
        expect(monthLongLabel('2026-09')).toBe('September')
        expect(monthLongLabel('2026-01')).toBe('January')
        expect(monthLongLabel('2026-12')).toBe('December')
      }
    } finally {
      process.env.TZ = original
    }
  })

  it('regression: a September budget reminder never renders August', () => {
    const budget: Budget = { id: 'b1', categoryId: 'housing', month: '2026-09', limitChetrum: 5000, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }
    const reminders = buildReminders([budget], [], { housing: 6000 }, '2026-09', defaultReminderSettings, new Date(2026, 8, 15))
    expect(reminders).toHaveLength(1)
    expect(reminders[0].body).toBe('Housing / EMI has used 120% of its September budget.')
    expect(reminders[0].body).not.toContain('August')
  })
})
