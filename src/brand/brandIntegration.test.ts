/// <reference types="node" />

import {
  createHash,
} from 'node:crypto'
import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function readText(
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

function readBinary(
  relativePath: string,
): Buffer {
  return readFileSync(
    new URL(
      relativePath,
      import.meta.url,
    ),
  )
}

function sha256(
  value: Buffer,
): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
}

const landing =
  readText('../pages/LandingPage.tsx')

const shell =
  readText('../components/AppShell.tsx')

const onboarding =
  readText('../pages/OnboardingPage.tsx')

const appLock =
  readText('../security/AppLockGate.tsx')

const vite =
  readText('../../vite.config.ts')

const lockup =
  readBinary('../../public/money-saathi-lockup.png')

const emblem =
  readBinary('../../public/money-saathi-emblem.png')

const appIcon =
  readBinary('../../public/money-saathi-app-icon.png')

const maskable =
  readBinary('../../public/money-saathi-maskable-icon.png')

describe('Money Saathi approved-brand fidelity', () => {
  it('locks the exact approved derived artwork against accidental redraws', () => {
    expect(sha256(lockup)).toBe(
      '1cd33e78c235c635ea5cc4b610ec67bad4c1b4bdf7b89e7855d7ae1a4b0591c3',
    )

    expect(sha256(emblem)).toBe(
      'f28af565e810737564c405735477ca73fdd60ffbb5e376a6b4e6c2120ce1d300',
    )

    expect(sha256(appIcon)).toBe(
      '3c5065c3e06d8aa5b78e9b4229146cdb7c7196b8e77a9f27637e087f77e88831',
    )

    expect(sha256(maskable)).toBe(
      '8eedf6795c9238b76012d6fee0c0aa6640ce633abcefb51361ba52a8fef3d9d9',
    )
  })

  it('uses the approved lockup in primary brand positions', () => {
    expect(landing).toContain(
      '/money-saathi-lockup.png',
    )

    expect(shell).toContain(
      '/money-saathi-lockup.png',
    )

    expect(onboarding).toContain(
      '/money-saathi-lockup.png',
    )

    expect(appLock).toContain(
      '/money-saathi-emblem.png',
    )
  })

  it('uses approved icon derivatives for the PWA', () => {
    expect(vite).toContain(
      '/money-saathi-app-icon.png',
    )

    expect(vite).toContain(
      '/money-saathi-maskable-icon.png',
    )

    expect(vite).not.toContain(
      'money-saathi-icon.svg',
    )
  })
})