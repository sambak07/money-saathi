import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  onboardingNeeds,
} from './onboardingProfile'

describe('onboarding profile mapping', () => {
  it('maps a salaried spending-focused user to useful existing needs', () => {
    expect(
      onboardingNeeds(
        'salary',
        'control-spending',
      ),
    ).toEqual([
      'salary',
      'daily-money',
    ])
  })

  it('maps a business user without mixing business and personal records', () => {
    expect(
      onboardingNeeds(
        'business',
        'save-more',
      ),
    ).toEqual([
      'small-business',
      'irregular-income',
      'savings-goals',
    ])
  })

  it('does not duplicate an overlapping daily-money need', () => {
    expect(
      onboardingNeeds(
        'student',
        'understand-money',
      ),
    ).toEqual([
      'daily-money',
    ])
  })
})