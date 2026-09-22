import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneySaathiProfile,
} from '../profile/userProfile'
import {
  buildGettingStartedJourney,
} from './gettingStarted'

const simpleProfile: MoneySaathiProfile = {
  needs: [
    'daily-money',
  ],
  homeExperience: 'simple',
}

describe('guided first-time journey', () => {
  it('keeps a beginner journey short and understandable', () => {
    const journey =
      buildGettingStartedJourney(
        simpleProfile,
        {
          transactionCount: 0,
          regularMoneyCount: 0,
          goalCount: 0,
          businessCount: 0,
          safetyBufferChetrum: 0,
        },
      )

    expect(
      journey.steps.map(
        (step) => step.id,
      ),
    ).toEqual([
      'personalize',
      'first-money',
      'safety-buffer',
    ])
  })

  it('adds salary planning only when it is relevant', () => {
    const journey =
      buildGettingStartedJourney(
        {
          needs: [
            'salary',
          ],
          homeExperience: 'full',
        },
        {
          transactionCount: 1,
          regularMoneyCount: 0,
          goalCount: 0,
          businessCount: 0,
          safetyBufferChetrum: 0,
        },
      )

    expect(
      journey.steps.some(
        (step) =>
          step.id === 'regular-money',
      ),
    ).toBe(true)
  })

  it('adds business setup without mixing it into personal steps', () => {
    const journey =
      buildGettingStartedJourney(
        {
          needs: [
            'small-business',
          ],
          homeExperience: 'full',
        },
        {
          transactionCount: 1,
          regularMoneyCount: 0,
          goalCount: 0,
          businessCount: 0,
          safetyBufferChetrum: 100_000,
        },
      )

    expect(
      journey.steps.at(-1)?.id,
    ).toBe('business')

    expect(
      journey.nextStep?.id,
    ).toBe('business')
  })

  it('shows completion from real app data instead of manual checkboxes', () => {
    const journey =
      buildGettingStartedJourney(
        {
          needs: [
            'salary',
            'savings-goals',
          ],
          homeExperience: 'simple',
        },
        {
          transactionCount: 3,
          regularMoneyCount: 2,
          goalCount: 1,
          businessCount: 0,
          safetyBufferChetrum: 500_000,
        },
      )

    expect(journey.isComplete).toBe(true)
    expect(journey.nextStep).toBeNull()
  })
})
