import { describe, expect, it } from 'vitest'
import { createSingleFlightGuard, mapBackupPasswordError, nextEraseStep } from './interaction-reliability'

describe('interaction reliability helpers', () => {
  it('allows one in-flight operation', () => { const guard = createSingleFlightGuard(); expect(guard.enter()).toBe(true); expect(guard.enter()).toBe(false); guard.release(); expect(guard.enter()).toBe(true) })
  it('maps wrong backup passwords to inline copy', () => { expect(mapBackupPasswordError(new Error('Invalid password'))).toBe('That password could not unlock this backup.') })
  it('progresses erase flow and supports going back', () => { expect(nextEraseStep('erase', 'continue')).toBe('eraseConfirm'); expect(nextEraseStep('eraseConfirm', 'back')).toBe('erase'); expect(nextEraseStep('erase', 'cancel')).toBeNull() })
})
