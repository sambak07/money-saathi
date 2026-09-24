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

describe('business inventory and COGS data integration', () => {
  it('upgrades IndexedDB and creates inventory and trade-line stores', () => {
    expect(db).toContain(
      'const DATABASE_VERSION = 11',
    )

    expect(db).toContain(
      "const BUSINESS_INVENTORY_ITEM_STORE = 'business-inventory-items'",
    )

    expect(db).toContain(
      "const BUSINESS_TRADE_LINE_STORE = 'business-trade-lines'",
    )
  })

  it('supports local inventory and trade-line CRUD', () => {
    expect(db).toContain(
      'getBusinessInventoryItems(',
    )

    expect(db).toContain(
      'upsertBusinessInventoryItem(',
    )

    expect(db).toContain(
      'getBusinessTradeLines(',
    )

    expect(db).toContain(
      'upsertBusinessTradeLine(',
    )

    expect(db).toContain(
      'deleteBusinessTradeLine(',
    )
  })

  it('cascades trade lines when a trade entry is deleted', () => {
    expect(db).toContain(
      ".index('tradeEntryId')",
    )

    expect(db).toContain(
      'Could not find business trade lines',
    )
  })

  it('includes inventory data in snapshot and encrypted backup migration', () => {
    expect(db).toContain(
      'businessInventoryItems: BusinessInventoryItem[]',
    )

    expect(db).toContain(
      'businessTradeLines: BusinessTradeLine[]',
    )

    expect(backup).toContain(
      'isValidBusinessInventoryItem',
    )

    expect(backup).toContain(
      'isValidBusinessTradeLine',
    )

    expect(backup).toContain(
      'data.businessInventoryItems',
    )

    expect(backup).toContain(
      'data.businessTradeLines',
    )
  })

  it('keeps COGS explicit rather than inventing it from sale price', () => {
    expect(types).toContain(
      'costOfGoodsSoldChetrum',
    )

    expect(types).toContain(
      'currentUnitCostChetrum',
    )

    expect(types).toContain(
      'quantityMilliUnits',
    )
  })
})