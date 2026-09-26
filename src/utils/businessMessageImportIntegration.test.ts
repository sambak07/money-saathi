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
      '../pages/BusinessQuickAddPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('business payment-message triage', () => {
  it('reuses the local transaction-message parser without writing business records', () => {
    expect(page).toContain(
      'parseTransactionMessage',
    )

    expect(page).toContain(
      'Read message locally',
    )

    expect(page).not.toContain(
      'addBusinessTransaction',
    )

    expect(page).not.toContain(
      'upsertBusinessOpenItem',
    )

    expect(page).not.toContain(
      'saveBusinessTradeEntryWithLines',
    )
  })

  it('requires the user to classify the business meaning of the payment', () => {
    expect(page).toContain(
      'What was this payment?',
    )

    expect(page).toContain(
      'Cash / QR sale',
    )

    expect(page).toContain(
      'Customer payment',
    )

    expect(page).toContain(
      'Supplier payment',
    )

    expect(page).toContain(
      'Stock / goods purchase',
    )

    expect(page).toContain(
      'Own-account / owner transfer',
    )
  })

  it('states the accounting boundary explicitly', () => {
    expect(page).toContain(
      'The payment amount is evidence of cash movement only.',
    )

    expect(page).toContain(
      'does not prove a sale, purchase, customer settlement,',
    )

    expect(page).toContain(
      'COGS or stock movement.',
    )
  })
})


describe('business payment-message runtime ordering', () => {
  it('builds imported query context before message actions call businessRoute', () => {
    const queryIndex =
      page.indexOf(
        'const importedQuery =',
      )

    const actionsIndex =
      page.indexOf(
        'const messageActions =',
      )

    expect(queryIndex).toBeGreaterThanOrEqual(
      0,
    )

    expect(actionsIndex).toBeGreaterThan(
      queryIndex,
    )
  })
})
