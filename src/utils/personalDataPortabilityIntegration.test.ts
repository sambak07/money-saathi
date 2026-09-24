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
      '../pages/DataExportPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const portable =
  readFileSync(
    new URL(
      '../export/personalPortableExport.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('personal data portability integration', () => {
  it('loads the complete IndexedDB snapshot for personal structured export', () => {
    expect(page).toContain(
      'exportDatabaseSnapshot()',
    )

    expect(page).toContain(
      'personalSnapshot',
    )

    expect(page).toContain(
      'buildPersonalPortableJson(',
    )
  })

  it('offers transaction CSV and complete personal JSON separately', () => {
    expect(page).toContain(
      'Transactions CSV',
    )

    expect(page).toContain(
      'Complete personal JSON',
    )
  })

  it('keeps business collections outside the personal JSON payload', () => {
    expect(portable).toContain(
      'transactions:',
    )

    expect(portable).toContain(
      'financialSchemes:',
    )

    expect(portable).not.toContain(
      'businessProfiles:',
    )

    expect(portable).not.toContain(
      'businessTransactions:',
    )
  })

  it('does not include Vault or App Lock data', () => {
    expect(portable).not.toContain(
      'Vault',
    )

    expect(portable).not.toContain(
      'pinVerifier',
    )
  })
})