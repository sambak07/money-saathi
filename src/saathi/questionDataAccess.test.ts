import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  SaathiContextPermissions,
} from './contextPermissions'
import {
  canUseSaathiIntent,
  getSaathiPermissionMessage,
  isSaathiCategoryEnabled,
  requiredCategoriesForSaathiIntent,
} from './questionDataAccess'

function permissions(
  enabled: boolean,
  categories: Partial<
    SaathiContextPermissions['categories']
  > = {},
): SaathiContextPermissions {
  return {
    version: 1,
    enabled,
    categories: {
      profile: false,
      'money-summary': false,
      transactions: false,
      commitments: false,
      savings: false,
      loans: false,
      goals: false,
      ...categories,
    },
  }
}

describe('Saathi question data access', () => {
  it('keeps learning available when personal data access is off', () => {
    const off =
      permissions(
        false,
      )

    expect(
      canUseSaathiIntent(
        off,
        'learn',
      ),
    ).toBe(true)

    expect(
      canUseSaathiIntent(
        off,
        'affordability',
      ),
    ).toBe(false)

    expect(
      getSaathiPermissionMessage(
        off,
        'affordability',
      ),
    ).toContain(
      'Local Saathi data access is Off',
    )
  })

  it('enforces category-specific personal question access', () => {
    const summaryOnly =
      permissions(
        true,
        {
          'money-summary':
            true,
        },
      )

    expect(
      canUseSaathiIntent(
        summaryOnly,
        'affordability',
      ),
    ).toBe(true)

    expect(
      canUseSaathiIntent(
        summaryOnly,
        'saving-guidance',
      ),
    ).toBe(false)

    const summaryAndSavings =
      permissions(
        true,
        {
          'money-summary':
            true,
          savings:
            true,
        },
      )

    expect(
      canUseSaathiIntent(
        summaryAndSavings,
        'saving-guidance',
      ),
    ).toBe(true)
  })

  it('requires transaction permission for month comparison', () => {
    const summaryOnly =
      permissions(
        true,
        {
          'money-summary':
            true,
        },
      )

    expect(
      canUseSaathiIntent(
        summaryOnly,
        'month-change',
      ),
    ).toBe(false)

    const transactionAccess =
      permissions(
        true,
        {
          transactions:
            true,
        },
      )

    expect(
      canUseSaathiIntent(
        transactionAccess,
        'month-change',
      ),
    ).toBe(true)
  })

  it('requires both loans and savings for debt answers', () => {
    const loansOnly =
      permissions(
        true,
        {
          loans:
            true,
        },
      )

    expect(
      canUseSaathiIntent(
        loansOnly,
        'debt',
      ),
    ).toBe(false)

    expect(
      getSaathiPermissionMessage(
        loansOnly,
        'debt',
      ),
    ).toContain(
      'Savings and deposits',
    )

    const debtAccess =
      permissions(
        true,
        {
          loans:
            true,
          savings:
            true,
        },
      )

    expect(
      canUseSaathiIntent(
        debtAccess,
        'debt',
      ),
    ).toBe(true)
  })

  it('treats every category as disabled when the master switch is off', () => {
    const offWithSavedCategory =
      permissions(
        false,
        {
          transactions:
            true,
        },
      )

    expect(
      isSaathiCategoryEnabled(
        offWithSavedCategory,
        'transactions',
      ),
    ).toBe(false)
  })

  it('requires commitments for forward cash-flow questions', () => {
    expect(
      requiredCategoriesForSaathiIntent(
        'cash-flow-forecast',
      ),
    ).toEqual([
      'money-summary',
      'commitments',
    ])

    expect(
      requiredCategoriesForSaathiIntent(
        'goal-plan',
      ),
    ).toEqual([
      'goals',
      'loans',
      'savings',
    ])
  })
})
