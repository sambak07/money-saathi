import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  formatChetrumForInput,
  formatNu,
  parseNuToChetrum,
  parseNuToChetrumAllowZero,
} from './money'

describe('money utilities', () => {
  it('parses whole ngultrum exactly', () => {
    expect(parseNuToChetrum('1')).toBe(100)
  })

  it('parses one decimal place exactly', () => {
    expect(parseNuToChetrum('1.2')).toBe(120)
  })

  it('parses two decimals exactly', () => {
    expect(parseNuToChetrum('1250.50')).toBe(125050)
  })

  it('accepts commas without using floating-point multiplication', () => {
    expect(parseNuToChetrum('1,25,000.75')).toBe(12500075)
  })

  it('rejects zero for normal positive-money inputs', () => {
    expect(parseNuToChetrum('0')).toBeNull()
    expect(parseNuToChetrum('0.00')).toBeNull()
  })

  it('allows zero where zero is financially valid', () => {
    expect(parseNuToChetrumAllowZero('0')).toBe(0)
    expect(parseNuToChetrumAllowZero('0.00')).toBe(0)
  })

  it('rejects more than two decimal places', () => {
    expect(parseNuToChetrum('1.234')).toBeNull()
  })

  it('formats chetrum as Bhutan-style Nu. display', () => {
    expect(formatNu(125050)).toBe('Nu. 1,250.50')
    expect(formatNu(-125050)).toBe('Nu. -1,250.50')
  })

  it('formats exact edit-field values from integer chetrum', () => {
    expect(formatChetrumForInput(125050)).toBe('1250.50')
    expect(formatChetrumForInput(100)).toBe('1.00')
    expect(formatChetrumForInput(1)).toBe('0.01')
  })
})
