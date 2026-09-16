import { describe, expect, it } from 'vitest'
import { buildReminders } from './reminders'

describe('Phase E local security and reminders', () => {
  it('creates budget warnings at the threshold and skips unrelated months', () => {
    const budget = { id: 'b1', month: '2026-09', categoryId: 'food', limitChetrum: 1000, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }
    expect(buildReminders([budget], [], { food: 800 }, '2026-09')).toHaveLength(1)
    expect(buildReminders([budget], [], { food: 700 }, '2026-10')).toHaveLength(0)
  })
  it('clamps month-end recurring dates and deduplicates confirmed items', () => {
    const recurring = { id: 'r1', name: 'Rent', type: 'expense' as const, amountChetrum: 100, categoryId: 'housing', paymentMethod: 'Cash' as const, frequency: 'monthly' as const, dayOfMonth: 31, classification: 'essential' as const, isCommitment: true, active: true, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }
    expect(buildReminders([], [recurring], {}, '2026-09', new Date(2026, 8, 28))).toHaveLength(1)
    expect(buildReminders([], [{ ...recurring, lastConfirmedMonth: '2026-09' }], {}, '2026-09', new Date(2026, 8, 28))).toHaveLength(0)
  })
})
