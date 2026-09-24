import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessProfile,
} from '../types/business'
import {
  buildBusinessPortableJson,
  safeBusinessJsonFileName,
} from './businessPortableExport'

const business:
  BusinessProfile = {
    id: 'business-1',
    name: 'BAiL Auto',
    createdAt: 1,
    updatedAt: 1,
  }

describe('business portable export', () => {
  it('exports a versioned lossless JSON envelope', () => {
    const parsed =
      JSON.parse(
        buildBusinessPortableJson(
          {
            business,
            cashTransactions: [],
            parties: [],
            openItems: [],
            tradeEntries: [],
            tradeLines: [],
            inventoryItems: [],
          },
          '2026-09-24',
        ),
      )

    expect(
      parsed,
    ).toMatchObject({
      format:
        'MoneySaathiBusinessExport',
      version: 1,
      exportedOn:
        '2026-09-24',
      amountUnit:
        'chetrum',
      quantityUnit:
        'milli-unit',
      business: {
        id: 'business-1',
        name: 'BAiL Auto',
      },
    })
  })

  it('rejects cross-business records', () => {
    expect(
      () =>
        buildBusinessPortableJson(
          {
            business,
            cashTransactions: [
              {
                id: 'cash-1',
                businessId:
                  'other-business',
                kind: 'income',
                amountChetrum: 100,
                category: 'Sales',
                note: '',
                date: '2026-09-24',
                createdAt: 1,
                updatedAt: 1,
              },
            ],
            parties: [],
            openItems: [],
            tradeEntries: [],
            tradeLines: [],
            inventoryItems: [],
          },
          '2026-09-24',
        ),
    ).toThrow(
      'belongs to a different business',
    )
  })

  it('creates a safe JSON filename', () => {
    expect(
      safeBusinessJsonFileName(
        'BAiL Auto / Trongsa',
        '2026-09-24',
      ),
    ).toBe(
      'money-saathi-bail-auto-trongsa-2026-09-24.json',
    )
  })
})