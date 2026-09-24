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

const page =
  readSource('../pages/SaathiGuidePage.tsx')

const app =
  readSource('../App.tsx')

const more =
  readSource('../pages/MorePage.tsx')

const profile =
  readSource('../profile/userProfile.ts')

describe('Saathi inclusion foundation integration', () => {
  it('adds an explicit student / first-money setup choice', () => {
    expect(profile).toContain(
      "'student'",
    )

    expect(profile).toContain(
      'Student / first money',
    )
  })

  it('adds Saathi as a protected local app route', () => {
    expect(app).toContain(
      'path="/app/saathi"',
    )

    expect(more).toContain(
      "label: 'Saathi'",
    )
  })

  it('does not claim generative AI or Vault access in this stage', () => {
    expect(page).toContain(
      'no generative AI',
    )

    expect(page).toContain(
      'no Money Vault access',
    )

    expect(page).toContain(
      'external AI models',
    )
  })

  it('shows the evidence basis for guidance', () => {
    expect(page).toContain(
      'What this guidance used',
    )

    expect(page).toContain(
      'What it did not use',
    )
  })
})