import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  sanitizeFinancialSafetyPreference,
} from './financialSafetyPreference'

describe('financial safety preference', () => {
  it('does not invent a target for a new user', () => {
    expect(
      sanitizeFinancialSafetyPreference(null),
    ).toEqual({
      targetMonths: null,
    })
  })

  it('accepts supported emergency target horizons', () => {
    expect(
      sanitizeFinancialSafetyPreference({
        targetMonths: 6,
      }),
    ).toEqual({
      targetMonths: 6,
    })
  })

  it('rejects unsupported target horizons', () => {
    expect(
      sanitizeFinancialSafetyPreference({
        targetMonths: 5,
      }),
    ).toEqual({
      targetMonths: null,
    })
  })
})
