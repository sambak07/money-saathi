import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  sanitizeProfile,
  toggleNeed,
} from './userProfile'

describe('adaptive Money Saathi profile', () => {
  it('starts safely from invalid profile data', () => {
    expect(sanitizeProfile(null)).toEqual({
      needs: [],
    })
  })

  it('keeps only supported needs and removes duplicates', () => {
    expect(
      sanitizeProfile({
        needs: [
          'salary',
          'small-business',
          'salary',
          'unsupported',
        ],
      }),
    ).toEqual({
      needs: ['salary', 'small-business'],
    })
  })

  it('supports more than one financial need', () => {
    let profile = sanitizeProfile({
      needs: [],
    })

    profile = toggleNeed(
      profile,
      'daily-money',
    )

    profile = toggleNeed(
      profile,
      'retirement',
    )

    expect(profile.needs).toEqual([
      'daily-money',
      'retirement',
    ])
  })

  it('removes a need when selected again', () => {
    expect(
      toggleNeed(
        {
          needs: ['salary', 'savings-goals'],
        },
        'salary',
      ),
    ).toEqual({
      needs: ['savings-goals'],
    })
  })
})
