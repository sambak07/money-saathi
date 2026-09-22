import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  DEFAULT_PREFERENCES,
  sanitizePreferences,
} from './preferences'

describe('Money Saathi preferences', () => {
  it('uses defaults for invalid data', () => {
    expect(
      sanitizePreferences(null),
    ).toEqual(DEFAULT_PREFERENCES)
  })

  it('accepts supported display and safety options', () => {
    expect(
      sanitizePreferences({
        displayName: '  Karma  ',
        reportTrendMonths: 12,
        dashboardRecentCount: 8,
        safetyBufferChetrum: 250_000,
      }),
    ).toEqual({
      displayName: 'Karma',
      reportTrendMonths: 12,
      dashboardRecentCount: 8,
      safetyBufferChetrum: 250_000,
    })
  })

  it('falls back when unsupported values are supplied', () => {
    expect(
      sanitizePreferences({
        displayName: 'User',
        reportTrendMonths: 18,
        dashboardRecentCount: 99,
        safetyBufferChetrum: -1,
      }),
    ).toEqual({
      displayName: 'User',
      reportTrendMonths:
        DEFAULT_PREFERENCES.reportTrendMonths,
      dashboardRecentCount:
        DEFAULT_PREFERENCES.dashboardRecentCount,
      safetyBufferChetrum:
        DEFAULT_PREFERENCES.safetyBufferChetrum,
    })
  })
})
