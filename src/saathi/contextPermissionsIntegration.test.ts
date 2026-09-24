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

const engine =
  readSource('./contextPermissions.ts')

const page =
  readSource('../pages/SaathiPrivacyPage.tsx')

const app =
  readSource('../App.tsx')

describe('Saathi privacy integration', () => {
  it('keeps Saathi context access opt-in by default', () => {
    expect(engine).toContain(
      'enabled: false',
    )

    expect(engine).toContain(
      "'money-summary': false",
    )

    expect(engine).toContain(
      'transactions: false',
    )
  })

  it('does not expose Money Vault as a selectable context category', () => {
    expect(engine).not.toContain(
      "'vault'",
    )

    expect(page).toContain(
      'Money Vault is outside this permission system.',
    )
  })

  it('provides an exact local context preview without sending data anywhere', () => {
    expect(page).toContain(
      'Preview exact context',
    )

    expect(page).toContain(
      'This is a local preview only. It has not been sent anywhere.',
    )
  })

  it('adds a protected Saathi privacy route', () => {
    expect(app).toContain(
      'path="/app/saathi/privacy"',
    )
  })
})