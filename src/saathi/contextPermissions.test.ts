import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  SaathiContextSource,
} from './contextPermissions'
import {
  DEFAULT_SAATHI_CONTEXT_PERMISSIONS,
  buildSaathiContextEnvelope,
  recommendedCategoriesForIntent,
  sanitizeSaathiContextPermissions,
} from './contextPermissions'

function source():
  SaathiContextSource {
  return {
    today: '2026-09-24',
    safetyBufferChetrum: 20_000,
    needs: [
      'salary',
    ],
    transactions: [
      {
        id: 'secret-tx-id',
        kind: 'income',
        amountChetrum: 100_000,
        category: 'Salary',
        note: 'private transaction note',
        date: '2026-09-01',
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'expense-id',
        kind: 'expense',
        amountChetrum: 20_000,
        category: 'Food',
        note: 'private expense note',
        date: '2026-09-10',
        createdAt: 2,
        updatedAt: 2,
      },
    ],
    regularMoney: [],
    savingsAccounts: [
      {
        id: 'saving-id',
        name: 'Emergency savings',
        balanceChetrum: 50_000,
        note: 'private savings note',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    fixedDeposits: [],
    recurringDeposits: [],
    loans: [
      {
        id: 'loan-id',
        name: 'Vehicle loan',
        lender: 'Example Bank',
        originalPrincipalChetrum: 200_000,
        outstandingPrincipalChetrum: 150_000,
        annualRateBps: 900,
        emiChetrum: 10_000,
        tenureMonths: 24,
        startDate: '2026-01-01',
        note: 'private loan note',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    goals: [],
    goalContributions: [],
  }
}

describe('Saathi context permission engine', () => {
  it('denies all personal context by default', () => {
    const envelope =
      buildSaathiContextEnvelope(
        source(),
        DEFAULT_SAATHI_CONTEXT_PERMISSIONS,
        'overview',
      )

    expect(
      envelope.includedCategories,
    ).toEqual([])

    expect(
      envelope.context,
    ).toEqual({})
  })

  it('uses only the intersection of question need and explicit permission', () => {
    const envelope =
      buildSaathiContextEnvelope(
        source(),
        {
          version: 1,
          enabled: true,
          categories: {
            profile: false,
            'money-summary': true,
            transactions: true,
            commitments: false,
            savings: false,
            loans: false,
            goals: false,
          },
        },
        'overview',
      )

    expect(
      envelope.includedCategories,
    ).toEqual([
      'money-summary',
    ])

    expect(
      envelope.context.transactions,
    ).toBeUndefined()
  })

  it('uses no personal data for learn intent even when permissions are on', () => {
    const envelope =
      buildSaathiContextEnvelope(
        source(),
        {
          version: 1,
          enabled: true,
          categories: {
            profile: true,
            'money-summary': true,
            transactions: true,
            commitments: true,
            savings: true,
            loans: true,
            goals: true,
          },
        },
        'learn',
      )

    expect(
      recommendedCategoriesForIntent(
        'learn',
      ),
    ).toEqual([])

    expect(
      envelope.context,
    ).toEqual({})
  })

  it('removes notes and internal record IDs from transaction context', () => {
    const envelope =
      buildSaathiContextEnvelope(
        source(),
        {
          version: 1,
          enabled: true,
          categories: {
            profile: false,
            'money-summary': true,
            transactions: true,
            commitments: false,
            savings: false,
            loans: false,
            goals: false,
          },
        },
        'spending',
      )

    const serialized =
      JSON.stringify(
        envelope,
      )

    expect(
      serialized,
    ).not.toContain(
      'secret-tx-id',
    )

    expect(
      serialized,
    ).not.toContain(
      'private transaction note',
    )

    expect(
      serialized,
    ).not.toContain(
      'private expense note',
    )
  })

  it('sanitizes malformed stored permission state back to off', () => {
    expect(
      sanitizeSaathiContextPermissions({
        version: 99,
        enabled: true,
        categories: {},
      }).enabled,
    ).toBe(false)
  })
})