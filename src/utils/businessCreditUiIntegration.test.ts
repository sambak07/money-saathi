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

const app =
  source('../App.tsx')

const page =
  source('../pages/BusinessCreditPage.tsx')

const business =
  source('../pages/BusinessPage.tsx')

const more =
  source('../pages/MorePage.tsx')

const db =
  source('../storage/db.ts')

describe('Business 2.0 customers suppliers and dues integration', () => {
  it('registers and exposes the business-credit route', () => {
    expect(app).toContain(
      "const BusinessCreditPage = lazy(() => import('./pages/BusinessCreditPage'))",
    )

    expect(app).toContain(
      'path="/app/business/credit"',
    )

    expect(business).toContain(
      'to="/app/business/credit"',
    )

    expect(more).toContain(
      "to: '/app/business/credit'",
    )
  })

  it('supports customers suppliers receivables and payables locally', () => {
    expect(page).toContain(
      'getBusinessParties(',
    )

    expect(page).toContain(
      'upsertBusinessParty(',
    )

    expect(page).toContain(
      'getBusinessOpenItems(',
    )

    expect(page).toContain(
      'upsertBusinessOpenItem(',
    )

    expect(page).toContain(
      "'receivable'",
    )

    expect(page).toContain(
      "'payable'",
    )

    expect(page).not.toContain(
      'fetch(',
    )
  })

  it('keeps credit records explicitly separate from cash and personal money', () => {
    expect(page).toContain(
      'Credit and cash are different.',
    )

    expect(page).toContain(
      'does not create a Business cash transaction.',
    )

    expect(page).toContain(
      'Not cash or profit.',
    )

    expect(page).toContain(
      'never enter your personal',
    )

    expect(page).toContain(
      'ledger.',
    )
  })

  it('makes party deletion cascade linked credit records', () => {
    expect(db).toContain(
      'Could not find business party credit records',
    )

    expect(db).toContain(
      ".index('partyId')",
    )

    expect(db).toContain(
      'openItemKeys',
    )
  })

  it('does not claim accounting tax or reconciliation functionality', () => {
    expect(page).toContain(
      'not audited accounting',
    )

    expect(page).toContain(
      'tax filing',
    )

    expect(page).toContain(
      'bank reconciliation system',
    )
  })
})