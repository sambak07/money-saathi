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

const guard =
  readFileSync(
    new URL(
      './vaultUnlockGuard.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('Vault unlock throttling integration', () => {
  it('checks the guard before deriving a Vault key', () => {
    const guardIndex =
      page.indexOf(
        'getVaultUnlockGuard()',
      )

    const unlockIndex =
      page.indexOf(
        'await unlockVaultKey(',
      )

    expect(
      guardIndex,
    ).toBeGreaterThanOrEqual(0)

    expect(
      unlockIndex,
    ).toBeGreaterThan(
      guardIndex,
    )
  })

  it('records only passphrase-verification failures', () => {
    expect(page).toContain(
      'recordVaultUnlockFailure()',
    )

    expect(page).toContain(
      'The Vault passphrase was accepted, but one or more encrypted records',
    )
  })

  it('resets the guard after the passphrase is verified', () => {
    expect(page).toContain(
      'resetVaultUnlockGuard()',
    )
  })

  it('persists cooldown metadata locally instead of in Vault records', () => {
    expect(guard).toContain(
      'money-saathi:vault-unlock-guard:v1',
    )

    expect(guard).toContain(
      'localStorage',
    )

    expect(guard).not.toContain(
      'ciphertext',
    )

    expect(guard).not.toContain(
      'passphrase:',
    )
  })
})