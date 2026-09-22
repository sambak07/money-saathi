import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  sanitizeIrregularIncomePreference,
} from './irregularIncomePreference'

describe('irregular income preference', () => {
  it('defaults to no planning floor', () => {
    expect(
      sanitizeIrregularIncomePreference(null),
    ).toEqual({
      planningFloorChetrum: 0,
    })
  })

  it('accepts a non-negative safe integer floor', () => {
    expect(
      sanitizeIrregularIncomePreference({
        planningFloorChetrum: 250_000,
      }),
    ).toEqual({
      planningFloorChetrum: 250_000,
    })
  })

  it('rejects unsafe and negative values', () => {
    expect(
      sanitizeIrregularIncomePreference({
        planningFloorChetrum: -1,
      }),
    ).toEqual({
      planningFloorChetrum: 0,
    })

    expect(
      sanitizeIrregularIncomePreference({
        planningFloorChetrum:
          Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toEqual({
      planningFloorChetrum: 0,
    })
  })
})
