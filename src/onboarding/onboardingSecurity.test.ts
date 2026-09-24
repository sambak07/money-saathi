/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const onboardingSource =
  readFileSync(
    new URL(
      '../pages/OnboardingPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('first-run App Lock onboarding', () => {
  it('adds App Lock as an explicit fifth onboarding step', () => {
    expect(onboardingSource).toContain(
      'const totalSteps = 5',
    )

    expect(onboardingSource).toContain(
      "step === 5",
    )

    expect(onboardingSource).toContain(
      'Add a 6-digit PIN?',
    )
  })

  it('requires confirmation before enabling the local lock', () => {
    expect(onboardingSource).toContain(
      'newPin !== confirmPin',
    )

    expect(onboardingSource).toContain(
      'await enableAppLock(newPin)',
    )

    expect(onboardingSource).toContain(
      'Confirm PIN',
    )
  })

  it('keeps App Lock optional and does not invent account recovery', () => {
    expect(onboardingSource).toContain(
      'Skip for now',
    )

    expect(onboardingSource).toContain(
      'There is no email or OTP',
    )

    expect(onboardingSource).toContain(
      'App Lock is a local privacy barrier',
    )
  })
})