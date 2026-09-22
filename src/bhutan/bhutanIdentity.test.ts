import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  BHUTAN_AUDIENCES,
  BHUTAN_IDENTITY,
  BHUTAN_PRODUCT_PRINCIPLES,
} from './bhutanIdentity'

describe('Bhutan-first identity', () => {
  it('uses Ngultrum as the native currency identity', () => {
    expect(
      BHUTAN_IDENTITY.currencyName,
    ).toBe('Ngultrum')

    expect(
      BHUTAN_IDENTITY.currencySymbol,
    ).toBe('Nu.')
  })

  it('uses the Bhutan English locale foundation', () => {
    expect(
      BHUTAN_IDENTITY.locale,
    ).toBe('en-BT')

    expect(
      BHUTAN_IDENTITY.country,
    ).toBe('Bhutan')
  })

  it('keeps the product inclusive across different life stages', () => {
    expect(
      BHUTAN_AUDIENCES,
    ).toContain('Student & beginner')

    expect(
      BHUTAN_AUDIENCES,
    ).toContain('Small business')

    expect(
      BHUTAN_AUDIENCES,
    ).toContain('Pensioner & retiree')
  })

  it('defines culture as product context rather than decoration', () => {
    expect(
      BHUTAN_PRODUCT_PRINCIPLES.some(
        (principle) =>
          principle.title ===
          'Modern Bhutanese identity',
      ),
    ).toBe(true)
  })
})
