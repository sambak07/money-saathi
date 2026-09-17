import { describe, expect, it } from 'vitest'
import { goalProgressPercent, goalRemaining, goalVisualProgress, goalReached, type Goal } from './goals'

const goal: Goal = { id: 'g1', name: 'Emergency Fund', targetChetrum: 10000000, savedChetrum: 2000000, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }

describe('savings goal calculations', () => {
  it('calculates remaining and progress', () => { expect(goalRemaining(goal)).toBe(8000000); expect(goalProgressPercent(goal)).toBe(20); expect(goalVisualProgress(goal)).toBe(20) })
  it('handles zero, reached, and overfunded goals', () => { expect(goalProgressPercent({ ...goal, savedChetrum: 0 })).toBe(0); expect(goalProgressPercent({ ...goal, savedChetrum: 10000000 })).toBe(100); expect(goalReached({ ...goal, savedChetrum: 10000000 })).toBe(true); expect(goalRemaining({ ...goal, savedChetrum: 11000000 })).toBe(0); expect(goalProgressPercent({ ...goal, savedChetrum: 11000000 })).toBe(110); expect(goalVisualProgress({ ...goal, savedChetrum: 11000000 })).toBe(100) })
})
