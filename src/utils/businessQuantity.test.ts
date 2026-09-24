import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  formatBusinessQuantity,
  parseBusinessQuantityToMilliUnits,
} from './businessQuantity'

describe('business quantity parser', () => {
  it('parses whole and fractional units without floating point', () => {
    expect(
      parseBusinessQuantityToMilliUnits(
        '12',
      ),
    ).toBe(12_000)

    expect(
      parseBusinessQuantityToMilliUnits(
        '1.5',
      ),
    ).toBe(1_500)

    expect(
      parseBusinessQuantityToMilliUnits(
        '0.125',
      ),
    ).toBe(125)
  })

  it('rejects negative values and more than three decimals', () => {
    expect(
      parseBusinessQuantityToMilliUnits(
        '-1',
      ),
    ).toBeNull()

    expect(
      parseBusinessQuantityToMilliUnits(
        '1.2345',
      ),
    ).toBeNull()
  })

  it('formats milli-units cleanly', () => {
    expect(
      formatBusinessQuantity(
        12_000,
      ),
    ).toBe('12')

    expect(
      formatBusinessQuantity(
        1_250,
      ),
    ).toBe('1.25')

    expect(
      formatBusinessQuantity(
        -500,
      ),
    ).toBe('-0.5')
  })
})