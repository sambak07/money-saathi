/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function readSource(
  relativePath: string,
): string {
  return readFileSync(
    new URL(
      relativePath,
      import.meta.url,
    ),
    'utf8',
  )
}

const icon =
  readSource('../../public/money-saathi-icon.svg')

const landing =
  readSource('../pages/LandingPage.tsx')

const appShell =
  readSource('../components/AppShell.tsx')

const onboarding =
  readSource('../pages/OnboardingPage.tsx')

const appLock =
  readSource('../security/AppLockGate.tsx')

const landingStyles =
  readSource('../styles/landing.css')

describe('Money Saathi production brand integration', () => {
  it('uses a self-contained original SVG mark with no external image dependency', () => {
    expect(icon).toContain(
      'viewBox="0 0 64 64"',
    )

    expect(icon).toContain(
      '#175a43',
    )

    expect(icon).toContain(
      '#d6a13d',
    )

    expect(icon).not.toContain(
      '<image',
    )

    expect(icon).not.toContain(
      'http://www.w3.org/1999/xlink',
    )

    expect(icon).not.toContain(
      '<script',
    )
  })

  it('uses the production mark in primary brand touchpoints', () => {
    for (const source of [
      landing,
      appShell,
      onboarding,
      appLock,
    ]) {
      expect(source).toContain(
        '/money-saathi-icon.svg',
      )
    }
  })

  it('keeps the Home atmosphere CSS-only with no external decorative artwork', () => {
    expect(landingStyles).toContain(
      'premium Bhutan Home background',
    )

    expect(landingStyles).toContain(
      'clip-path:',
    )

    expect(landingStyles).toContain(
      'radial-gradient(',
    )
  })
})