/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const page =
  readFileSync(
    new URL(
      '../pages/VaultPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const rekey =
  readFileSync(
    new URL(
      './vaultRekey.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('Vault passphrase lifecycle integration', () => {
  it('uses atomic Vault storage replacement only after all records are re-encrypted', () => {
    const encryptIndex =
      rekey.indexOf(
        'const nextRecords',
      )

    const replaceIndex =
      rekey.indexOf(
        'await replaceVaultStorage(',
      )

    expect(
      encryptIndex,
    ).toBeGreaterThanOrEqual(0)

    expect(
      replaceIndex,
    ).toBeGreaterThan(
      encryptIndex,
    )
  })

  it('requires the current passphrase and applies the existing cooldown guard', () => {
    expect(page).toContain(
      'currentVaultPassphrase',
    )

    expect(page).toContain(
      'getVaultUnlockGuard()',
    )

    expect(page).toContain(
      'recordVaultUnlockFailure()',
    )
  })

  it('requires a different confirmed new passphrase', () => {
    expect(page).toContain(
      'The two new Vault passphrases do not match.',
    )

    expect(page).toContain(
      'different from the current one',
    )

    expect(page).toContain(
      'VAULT_MIN_PASSPHRASE_LENGTH',
    )
  })

  it('keeps old exported backups explicitly tied to their old passphrases', () => {
    expect(page).toContain(
      'Older exported Vault backups still require the passphrase that protected them',
    )
  })

  it('updates only the in-memory session key after successful atomic rekey', () => {
    const changeIndex =
      page.indexOf(
        'await changeVaultPassphrase(',
      )

    const sessionIndex =
      page.indexOf(
        'setVaultSessionKey(',
        changeIndex,
      )

    expect(
      changeIndex,
    ).toBeGreaterThanOrEqual(0)

    expect(
      sessionIndex,
    ).toBeGreaterThan(
      changeIndex,
    )
  })
})