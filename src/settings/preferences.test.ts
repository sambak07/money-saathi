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

  it('accepts supported report and dashboard options', () => {
    expect(
      sanitizePreferences({
        displayName: '  Karma  ',
        reportTrendMonths: 12,
        dashboardRecentCount: 8,
      }),
    ).toEqual({
      displayName: 'Karma',
      reportTrendMonths: 12,
      dashboardRecentCount: 8,
    })
  })

  it('falls back when unsupported values are supplied', () => {
    expect(
      sanitizePreferences({
        displayName: 'User',
        reportTrendMonths: 18,
        dashboardRecentCount: 99,
      }),
    ).toEqual({
      displayName: 'User',
      reportTrendMonths:
        DEFAULT_PREFERENCES.reportTrendMonths,
      dashboardRecentCount:
        DEFAULT_PREFERENCES.dashboardRecentCount,
    })
  })
})
