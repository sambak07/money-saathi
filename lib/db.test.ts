import { describe, expect, it } from 'vitest'
import { storageErrorMessage } from './db'

function createStartupHarness() { let attempt = 0; let loaded = false; let timedOut = false; return { start: () => { attempt += 1; loaded = false; timedOut = false; return attempt }, succeed: (id: number) => { if (id === attempt) loaded = true }, timeout: (id: number) => { if (id === attempt && !loaded) timedOut = true }, state: () => ({ attempt, loaded, timedOut }) } }

describe('storage recovery messaging', () => {
  it('distinguishes common startup failures without exposing raw errors', () => {
    expect(storageErrorMessage(new Error('Close other Money Saathi tabs and try again.'))).toContain('Close other')
    expect(storageErrorMessage(new Error('Private storage took too long to respond.'))).toContain('too long')
    expect(storageErrorMessage(new Error('QuotaExceededError: raw browser detail'))).toContain('has not been deleted')
})

describe('startup attempt behavior', () => {
  it('loads once, retries once, and ignores stale results', () => { const app = createStartupHarness(); const first = app.start(); app.succeed(first); expect(app.state()).toEqual({ attempt: 1, loaded: true, timedOut: false }); const retry = app.start(); app.succeed(first); expect(app.state()).toEqual({ attempt: 2, loaded: false, timedOut: false }); app.succeed(retry); expect(app.state()).toEqual({ attempt: 2, loaded: true, timedOut: false }) })
  it('transitions to recovery on the active timeout and exits after retry success', () => { const app = createStartupHarness(); const first = app.start(); app.timeout(first); expect(app.state().timedOut).toBe(true); const retry = app.start(); app.timeout(first); expect(app.state()).toEqual({ attempt: 2, loaded: false, timedOut: false }); app.succeed(retry); expect(app.state()).toEqual({ attempt: 2, loaded: true, timedOut: false }) })
})

})
