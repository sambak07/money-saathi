import { describe, expect, it } from 'vitest'
import { safeToChetrum } from './currency'

describe('safe money parsing', () => {
  it('returns inline-safe errors for malformed values', () => {
    expect(safeToChetrum('abc').value).toBeUndefined()
    expect(safeToChetrum('abc').error).toBeTruthy()
    expect(safeToChetrum('1.001').value).toBeUndefined()
    expect(safeToChetrum('1e3').value).toBeUndefined()
  })
  it('parses valid grouped amounts', () => { expect(safeToChetrum('1,250.50').value).toBe(125050) })
})
