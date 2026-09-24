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

const app =
  readSource('../App.tsx')

const more =
  readSource('../pages/MorePage.tsx')

const shell =
  readSource('../components/AppShell.tsx')

const page =
  readSource('../pages/VaultPage.tsx')

describe('Money Vault foundation integration', () => {
  it('exposes Money Vault through the protected app', () => {
    expect(app).toContain(
      "path=\"/app/vault\"",
    )

    expect(more).toContain(
      "label: 'Money Vault'",
    )

    expect(shell).toContain(
      "'/app/vault'",
    )
  })

  it('states the credential boundary clearly', () => {
    expect(page).toContain(
      'Never store passwords or authentication secrets here.',
    )

    expect(page).toContain(
      'ATM or card PINs',
    )

    expect(page).toContain(
      'CVVs',
    )

    expect(page).toContain(
      'OTPs',
    )

    expect(page).toContain(
      'seed phrases',
    )
  })

  it('keeps AI access off in this foundation', () => {
    expect(page).toContain(
      'Saathi AI access: off',
    )

    expect(page).toContain(
      'does not send Money Vault records to',
    )
  })
})