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

const settings =
  readSource('../pages/SettingsPage.tsx')

const vaultPage =
  readSource('../pages/VaultPage.tsx')

describe('Money Vault data controls', () => {
  it('includes Money Vault in the app-wide DELETE ALL flow', () => {
    expect(settings).toContain(
      'await clearVaultStorage()',
    )

    expect(settings).toContain(
      'clearVaultSessionKey()',
    )

    expect(settings).toContain(
      'await clearAllFinancialData()',
    )

    expect(settings).toContain(
      'Money Vault records',
    )
  })

  it('warns that exported backups are outside browser deletion', () => {
    expect(settings).toContain(
      'Exported backup files are not deleted.',
    )
  })

  it('locks the Vault when the document moves to the background', () => {
    expect(vaultPage).toContain(
      "'visibilitychange'",
    )

    expect(vaultPage).toContain(
      "document.visibilityState ===",
    )

    expect(vaultPage).toContain(
      "'hidden'",
    )

    expect(vaultPage).toContain(
      'Money Vault locked because Money Saathi moved to the background.',
    )
  })

  it('clears the in-memory key on pagehide', () => {
    expect(vaultPage).toContain(
      "'pagehide'",
    )

    expect(vaultPage).toContain(
      'clearVaultSessionKey()',
    )
  })

  it('keeps Saathi outside decrypted Vault content', () => {
    expect(vaultPage).toContain(
      'Saathi cannot read Money Vault',
    )

    expect(vaultPage).toContain(
      'does not decrypt, inspect or use Vault',
    )
  })
})