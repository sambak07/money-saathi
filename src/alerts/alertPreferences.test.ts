import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  DEFAULT_ALERT_PREFERENCES,
  isWithinQuietHours,
  sanitizeAlertPreferences,
} from './alertPreferences'

describe('alert preferences', () => {
  it('uses conservative notification defaults', () => {
    expect(
      sanitizeAlertPreferences(null),
    ).toEqual(
      DEFAULT_ALERT_PREFERENCES,
    )

    expect(
      DEFAULT_ALERT_PREFERENCES
        .browserNotifications,
    ).toBe(false)
  })

  it('accepts supported reminder windows', () => {
    expect(
      sanitizeAlertPreferences({
        dueSoonDays: 14,
        browserNotifications: true,
        quietHoursEnabled: false,
        quietStart: '20:30',
        quietEnd: '06:45',
      }),
    ).toEqual({
      dueSoonDays: 14,
      browserNotifications: true,
      quietHoursEnabled: false,
      quietStart: '20:30',
      quietEnd: '06:45',
    })
  })

  it('handles overnight quiet hours', () => {
    expect(
      isWithinQuietHours(
        22,
        0,
        DEFAULT_ALERT_PREFERENCES,
      ),
    ).toBe(true)

    expect(
      isWithinQuietHours(
        6,
        30,
        DEFAULT_ALERT_PREFERENCES,
      ),
    ).toBe(true)

    expect(
      isWithinQuietHours(
        12,
        0,
        DEFAULT_ALERT_PREFERENCES,
      ),
    ).toBe(false)
  })
})
