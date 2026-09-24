import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneySaathiDatabaseSnapshot,
} from '../storage/db'
import {
  buildPersonalPortableJson,
  safePersonalJsonFileName,
} from './personalPortableExport'

function snapshot():
  MoneySaathiDatabaseSnapshot {
  return {
    transactions: [],
    budgets: [],
    regularMoney: [],
    goals: [],
    goalContributions: [],
    savingsAccounts: [],
    fixedDeposits: [],
    recurringDeposits: [],
    loans: [],
    financialSchemes: [],
    businessProfiles: [],
    businessTransactions: [],
    businessParties: [],
    businessOpenItems: [],
    businessTradeEntries: [],
    businessInventoryItems: [],
    businessTradeLines: [],
  }
}

describe('personal portable export', () => {
  it('exports only personal financial collections', () => {
    const parsed =
      JSON.parse(
        buildPersonalPortableJson(
          snapshot(),
          '2026-09-24',
        ),
      )

    expect(
      parsed,
    ).toMatchObject({
      format:
        'MoneySaathiPersonalExport',
      version: 1,
      exportedOn:
        '2026-09-24',
      amountUnit:
        'chetrum',
      personal: {
        transactions: [],
        budgets: [],
        regularMoney: [],
        goals: [],
        goalContributions: [],
        savingsAccounts: [],
        fixedDeposits: [],
        recurringDeposits: [],
        loans: [],
        financialSchemes: [],
      },
    })

    expect(
      parsed.personal.businessProfiles,
    ).toBeUndefined()

    expect(
      parsed.personal.businessTransactions,
    ).toBeUndefined()
  })

  it('does not include Vault or App Lock fields', () => {
    const json =
      buildPersonalPortableJson(
        snapshot(),
        '2026-09-24',
      )

    expect(json).not.toContain(
      'vault',
    )

    expect(json).not.toContain(
      'appLock',
    )

    expect(json).not.toContain(
      'pinVerifier',
    )
  })

  it('creates a stable personal JSON filename', () => {
    expect(
      safePersonalJsonFileName(
        '2026-09-24',
      ),
    ).toBe(
      'money-saathi-personal-2026-09-24.json',
    )
  })
})