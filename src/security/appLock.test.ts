import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  calculatePinThrottleAfterFailure,
  isValidAppPin,
} from './appLock'

describe('App Lock PIN validation', () => {
  it('accepts exactly six digits', () => {
    expect(isValidAppPin('123456')).toBe(true)
    expect(isValidAppPin('000000')).toBe(true)
  })

  it('rejects shorter and longer PINs', () => {
    expect(isValidAppPin('12345')).toBe(false)
    expect(isValidAppPin('1234567')).toBe(false)
  })

  it('rejects non-numeric PINs', () => {
    expect(isValidAppPin('12a456')).toBe(false)
    expect(isValidAppPin('123 56')).toBe(false)
  })

  it('starts a short cooldown on the fifth failed PIN attempt', () => {
    expect(
      calculatePinThrottleAfterFailure(
        4,
        1_000,
      ),
    ).toEqual({
      failures: 5,
      blockedUntil: 31_000,
    })
  })
})
