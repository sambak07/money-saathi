/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function source(
  path: string,
): string {
  return readFileSync(
    new URL(
      path,
      import.meta.url,
    ),
    'utf8',
  )
}

const db =
  source('../storage/db.ts')

const backup =
  source('../backup/backup.ts')

const types =
  source('../types/business.ts')

describe('business sales and purchases data integration', () => {
  it('upgrades IndexedDB and creates a dedicated trade register store', () => {
    expect(db).toContain(
      'const DATABASE_VERSION = 11',
    )

    expect(db).toContain(
      "const BUSINESS_TRADE_ENTRY_STORE = 'business-trade-entries'",
    )
  })

  it('provides local CRUD and snapshot coverage', () => {
    expect(db).toContain(
      'getBusinessTradeEntries(',
    )

    expect(db).toContain(
      'upsertBusinessTradeEntry(',
    )

    expect(db).toContain(
      'deleteBusinessTradeEntry(',
    )

    expect(db).toContain(
      'businessTradeEntries: BusinessTradeEntry[]',
    )

    expect(db).toContain(
      'snapshot.businessTradeEntries',
    )
  })

  it('covers trade entries in encrypted backup migration and validation', () => {
    expect(backup).toContain(
      'isValidBusinessTradeEntry',
    )

    expect(backup).toContain(
      'businessTradeEntries: number',
    )

    expect(backup).toContain(
      'data.businessTradeEntries',
    )

    expect(backup).toContain(
      "export const BACKUP_VERSION = 1",
    )

    expect(backup).toContain(
      "export const BACKUP_AAD = 'MoneySaathiBackup:v1'",
    )
  })

  it('keeps historical trade entries distinct from cash and dues records', () => {
    expect(types).toContain(
      'paidAtEntryChetrum',
    )

    expect(types).toContain(
      'BusinessPaymentMethod',
    )

    expect(types).not.toContain(
      'currentOutstandingChetrum',
    )
  })
})