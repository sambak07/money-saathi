import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculateMaturityDate,
  estimateSimpleFdInterestChetrum,
  multiplyChetrum,
  parsePercentToBasisPoints,
} from './assets'

describe('asset calculations', () => {
  it('parses annual rates into basis points', () => {
    expect(parsePercentToBasisPoints('7.50')).toBe(750)
    expect(parsePercentToBasisPoints('9')).toBe(900)
  })

  it('rejects invalid percentage precision', () => {
    expect(parsePercentToBasisPoints('7.555')).toBeNull()
  })

  it('calculates a simple FD estimate with integer arithmetic', () => {
    expect(
      estimateSimpleFdInterestChetrum(
        10_000_000,
        750,
        12,
      ),
    ).toBe(750_000)
  })

  it('multiplies RD principal safely', () => {
    expect(
      multiplyChetrum(
        500_000,
        4,
      ),
    ).toBe(2_000_000)
  })

  it('anchors maturity dates safely at month-end', () => {
    expect(
      calculateMaturityDate(
        '2026-01-31',
        1,
      ),
    ).toBe('2026-02-28')
  })
})
