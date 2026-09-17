import { describe, expect, it } from 'vitest'
import { greetingForHour, normalizeDisplayName } from './greeting'

describe('local preferred name and greeting', () => {
  it('trims names and accepts Unicode', () => expect(normalizeDisplayName('  བསྟན་པ་  ')).toBe('བསྟན་པ་'))
  it('supports skip and generic greetings', () => expect(greetingForHour(9, '')).toBe('Good morning'))
  it('supports morning, afternoon, and evening', () => {
    expect(greetingForHour(8, 'Tashi')).toBe('Good morning, Tashi')
    expect(greetingForHour(13, 'Tashi')).toBe('Good afternoon, Tashi')
    expect(greetingForHour(19, 'Tashi')).toBe('Good evening, Tashi')
  })
  it('caps names at fifty characters', () => expect(normalizeDisplayName('x'.repeat(60))).toHaveLength(50))
})
