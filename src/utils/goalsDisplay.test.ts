import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  Goal,
} from '../types/goal'
import {
  getGoalDateSummary,
} from './goals'

function goal(
  overrides:
    Partial<Goal> = {},
): Goal {
  return {
    id: 'goal-1',
    name: 'Emergency fund',
    targetChetrum:
      200_000,
    targetDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

describe('goal date display', () => {
  it('shows No target date only once when a goal has no target date', () => {
    const summary =
      getGoalDateSummary(
        goal(),
        50_000,
      )

    expect(summary).toBe(
      'No target date',
    )

    expect(
      summary.match(
        /No target date/g,
      ),
    ).toHaveLength(1)
  })

  it('keeps a meaningful reached status even when no target date was set', () => {
    expect(
      getGoalDateSummary(
        goal(),
        200_000,
      ),
    ).toBe(
      'No target date · Goal reached',
    )
  })

  it('keeps the date and its status when a target date exists', () => {
    const summary =
      getGoalDateSummary(
        goal({
          targetDate:
            '2099-12-31',
        }),
        50_000,
      )

    expect(summary).toContain(
      '31 Dec 2099',
    )

    expect(summary).toContain(
      'to target',
    )

    expect(summary).not.toContain(
      'No target date',
    )
  })
})
