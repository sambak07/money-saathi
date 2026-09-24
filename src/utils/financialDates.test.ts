import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addMonthsClampedIso,
} from './financialDates'

describe('financial due-date helpers', () => {
  it('adds deposit tenure by calendar month', () => {
    expect(
      addMonthsClampedIso(
        '2026-01-15',
        12,
      ),
    ).toBe(
      '2027-01-15',
    )
  })

  it('clamps month-end dates safely', () => {
    expect(
      addMonthsClampedIso(
        '2025-01-31',
        1,
      ),
    ).toBe(
      '2025-02-28',
    )

    expect(
      addMonthsClampedIso(
        '2024-01-31',
        1,
      ),
    ).toBe(
      '2024-02-29',
    )
  })

  it('rejects invalid dates and tenure', () => {
    expect(
      () =>
        addMonthsClampedIso(
          '2026-02-31',
          12,
        ),
    ).toThrow(
      'valid YYYY-MM-DD',
    )

    expect(
      () =>
        addMonthsClampedIso(
          '2026-01-01',
          0,
        ),
    ).toThrow(
      'between 1 and 1200 months',
    )
  })
})