import { describe, expect, it } from 'vitest'
import { storageErrorMessage } from './db'

describe('storage recovery messaging', () => {
  it('distinguishes common startup failures without exposing raw errors', () => {
    expect(storageErrorMessage(new Error('Close other Money Saathi tabs and try again.'))).toContain('Close other')
    expect(storageErrorMessage(new Error('Private storage took too long to respond.'))).toContain('too long')
    expect(storageErrorMessage(new Error('QuotaExceededError: raw browser detail'))).toContain('has not been deleted')
  })
})
