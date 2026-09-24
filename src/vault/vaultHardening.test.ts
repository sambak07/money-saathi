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

const session =
  readFileSync(
    new URL(
      './vaultSession.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('Money Vault hardening', () => {
  it('auto-locks after a bounded inactivity period', () => {
    expect(session).toContain(
      '10 * 60 * 1000',
    )

    expect(page).toContain(
      'locked after 10 minutes of inactivity',
    )

    expect(page).toContain(
      "'pointerdown'",
    )

    expect(page).toContain(
      "'keydown'",
    )
  })

  it('keeps Vault backup separate from the normal Money Saathi backup', () => {
    expect(page).toContain(
      "normal backup does not include Money",
    )

    expect(page).toContain(
      'Export encrypted Vault',
    )

    expect(page).toContain(
      'Restore and replace Vault',
    )
  })

  it('requires explicit replacement confirmation for restore', () => {
    expect(page).toContain(
      'I understand this replaces the Vault currently',
    )

    expect(page).toContain(
      'confirmRestore',
    )
  })
})