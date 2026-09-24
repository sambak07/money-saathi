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

describe('business credit data integration', () => {
  it('upgrades the local database and creates dedicated stores', () => {
    expect(db).toContain(
      'const DATABASE_VERSION = 10',
    )

    expect(db).toContain(
      "const BUSINESS_PARTY_STORE = 'business-parties'",
    )

    expect(db).toContain(
      "const BUSINESS_OPEN_ITEM_STORE = 'business-open-items'",
    )
  })

  it('provides local CRUD for parties and open items', () => {
    expect(db).toContain(
      'getBusinessParties(',
    )

    expect(db).toContain(
      'upsertBusinessParty(',
    )

    expect(db).toContain(
      'deleteBusinessParty(',
    )

    expect(db).toContain(
      'getBusinessOpenItems(',
    )

    expect(db).toContain(
      'upsertBusinessOpenItem(',
    )

    expect(db).toContain(
      'deleteBusinessOpenItem(',
    )
  })

  it('includes new business records in snapshot restore clear and business deletion', () => {
    expect(db).toContain(
      'businessParties: BusinessParty[]',
    )

    expect(db).toContain(
      'businessOpenItems: BusinessOpenItem[]',
    )

    expect(db).toContain(
      'snapshot.businessParties',
    )

    expect(db).toContain(
      'snapshot.businessOpenItems',
    )

    expect(db).toContain(
      'openItemKeys',
    )

    expect(db).toContain(
      'partyKeys',
    )
  })

  it('extends encrypted backup validation without changing the v1 cryptographic envelope', () => {
    expect(backup).toContain(
      'businessParties: number',
    )

    expect(backup).toContain(
      'businessOpenItems: number',
    )

    expect(backup).toContain(
      'isValidBusinessParty',
    )

    expect(backup).toContain(
      'isValidBusinessOpenItem',
    )

    expect(backup).toContain(
      "export const BACKUP_VERSION = 1",
    )

    expect(backup).toContain(
      "export const BACKUP_AAD = 'MoneySaathiBackup:v1'",
    )
  })

  it('does not mix business credit with personal transaction types', () => {
    expect(types).toContain(
      'export interface BusinessParty',
    )

    expect(types).toContain(
      'export interface BusinessOpenItem',
    )

    expect(types).toContain(
      "'receivable'",
    )

    expect(types).toContain(
      "'payable'",
    )
  })
})