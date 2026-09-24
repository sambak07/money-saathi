import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getBusinessMonthRange,
} from './businessReportPeriod'

describe('business report month range', () => {
  it('caps the current month at today', () => {
    expect(
      getBusinessMonthRange(
        '2026-09',
        '2026-09-24',
      ),
    ).toEqual({
      startDate:
        '2026-09-01',
      endDate:
        '2026-09-24',
    })
  })

  it('uses the full calendar month for a past month', () => {
    expect(
      getBusinessMonthRange(
        '2026-08',
        '2026-09-24',
      ),
    ).toEqual({
      startDate:
        '2026-08-01',
      endDate:
        '2026-08-31',
    })

    expect(
      getBusinessMonthRange(
        '2024-02',
        '2026-09-24',
      ),
    ).toEqual({
      startDate:
        '2024-02-01',
      endDate:
        '2024-02-29',
    })
  })

  it('rejects future and invalid months', () => {
    expect(
      () =>
        getBusinessMonthRange(
          '2026-10',
          '2026-09-24',
        ),
    ).toThrow(
      'cannot use a future month',
    )

    expect(
      () =>
        getBusinessMonthRange(
          '2026-13',
          '2026-09-24',
        ),
    ).toThrow(
      'month is invalid',
    )
  })
})