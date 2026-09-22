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
  it('uses a safe full-home default for invalid profile data', () => {
    expect(
      sanitizeProfile(null),
    ).toEqual({
      needs: [],
      homeExperience: 'full',
    })
  })

  it('keeps supported needs and removes duplicates', () => {
    expect(
      sanitizeProfile({
        needs: [
          'salary',
          'small-business',
          'salary',
          'unsupported',
        ],
        homeExperience: 'simple',
      }),
    ).toEqual({
      needs: [
        'salary',
        'small-business',
      ],
      homeExperience: 'simple',
    })
  })

  it('preserves the chosen home experience when toggling needs', () => {
    const profile = toggleNeed(
      {
        needs: ['daily-money'],
        homeExperience: 'simple',
      },
      'savings-goals',
    )

    expect(profile).toEqual({
      needs: [
        'daily-money',
        'savings-goals',
      ],
      homeExperience: 'simple',
    })
  })

  it('falls back to full home for unsupported home values', () => {
    expect(
      sanitizeProfile({
        needs: [],
        homeExperience: 'unknown',
      }),
    ).toEqual({
      needs: [],
      homeExperience: 'full',
    })
  })
})
