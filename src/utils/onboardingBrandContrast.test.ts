/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const css =
  readFileSync(
    new URL(
      '../styles/onboarding.css',
      import.meta.url,
    ),
    'utf8',
  )

const page =
  readFileSync(
    new URL(
      '../pages/OnboardingPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('onboarding brand contrast', () => {
  it('keeps the approved Money Saathi image lockup', () => {
    expect(page).toContain(
      'src="/money-saathi-lockup.png"',
    )

    expect(page).toContain(
      'className="onboarding-brand-mark"',
    )
  })

  it('places the onboarding lockup on a light readable surface', () => {
    expect(css).toMatch(
      /\.onboarding-brand\s*\{[\s\S]*background:\s*var\(--color-surface\);/,
    )

    expect(css).toMatch(
      /\.onboarding-brand\s*\{[\s\S]*border:\s*1px solid rgba\(214, 161, 61, 0\.38\);/,
    )

    expect(css).toMatch(
      /\.onboarding-brand\s*\{[\s\S]*border-radius:\s*14px;/,
    )
  })

  it('does not recolor or replace the approved logo asset', () => {
    expect(css).not.toContain(
      'filter: invert(',
    )

    expect(css).not.toContain(
      'mix-blend-mode:',
    )
  })
})
