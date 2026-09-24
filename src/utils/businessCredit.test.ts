import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  BusinessOpenItem,
  BusinessParty,
} from '../types/business'
import {
  summarizeBusinessCredit,
} from './businessCredit'

function party(
  id: string,
  role: BusinessParty['role'],
): BusinessParty {
  return {
    id,
    businessId: 'business-1',
    name: id,
    role,
    phone: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
  }
}

function item(
  partial: Partial<BusinessOpenItem> &
    Pick<
      BusinessOpenItem,
      | 'id'
      | 'partyId'
      | 'direction'
      | 'originalAmountChetrum'
      | 'outstandingAmountChetrum'
    >,
): BusinessOpenItem {
  return {
    businessId: 'business-1',
    date: '2026-09-01',
    dueDate: '',
    reference: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
    ...partial,
  }
}

describe('business receivables and payables summary', () => {
  it('keeps receivables and payables separate', () => {
    const summary =
      summarizeBusinessCredit(
        '2026-09-24',
        [
          party(
            'customer',
            'customer',
          ),
          party(
            'supplier',
            'supplier',
          ),
        ],
        [
          item({
            id: 'r1',
            partyId: 'customer',
            direction: 'receivable',
            originalAmountChetrum: 100_000,
            outstandingAmountChetrum: 80_000,
          }),
          item({
            id: 'p1',
            partyId: 'supplier',
            direction: 'payable',
            originalAmountChetrum: 50_000,
            outstandingAmountChetrum: 30_000,
          }),
        ],
      )

    expect(
      summary.openReceivableChetrum,
    ).toBe(80_000)

    expect(
      summary.openPayableChetrum,
    ).toBe(30_000)

    expect(
      summary.netOpenPositionChetrum,
    ).toBe(50_000)
  })

  it('excludes settled zero-outstanding items from open totals', () => {
    const summary =
      summarizeBusinessCredit(
        '2026-09-24',
        [
          party(
            'customer',
            'customer',
          ),
        ],
        [
          item({
            id: 'settled',
            partyId: 'customer',
            direction: 'receivable',
            originalAmountChetrum: 100_000,
            outstandingAmountChetrum: 0,
          }),
        ],
      )

    expect(
      summary.openItemCount,
    ).toBe(0)

    expect(
      summary.openReceivableChetrum,
    ).toBe(0)
  })

  it('flags only unpaid items past a due date as overdue', () => {
    const summary =
      summarizeBusinessCredit(
        '2026-09-24',
        [],
        [
          item({
            id: 'overdue',
            partyId: 'customer',
            direction: 'receivable',
            originalAmountChetrum: 100_000,
            outstandingAmountChetrum: 40_000,
            dueDate: '2026-09-20',
          }),
          item({
            id: 'future',
            partyId: 'supplier',
            direction: 'payable',
            originalAmountChetrum: 50_000,
            outstandingAmountChetrum: 50_000,
            dueDate: '2026-09-30',
          }),
        ],
      )

    expect(
      summary.overdueItemCount,
    ).toBe(1)

    expect(
      summary.overdueReceivableChetrum,
    ).toBe(40_000)

    expect(
      summary.overduePayableChetrum,
    ).toBe(0)
  })

  it('counts both-role parties as both customer and supplier', () => {
    const summary =
      summarizeBusinessCredit(
        '2026-09-24',
        [
          party(
            'both',
            'both',
          ),
        ],
        [],
      )

    expect(
      summary.partyCount,
    ).toBe(1)

    expect(
      summary.customerCount,
    ).toBe(1)

    expect(
      summary.supplierCount,
    ).toBe(1)
  })

  it('rejects outstanding amounts above the original amount', () => {
    expect(
      () =>
        summarizeBusinessCredit(
          '2026-09-24',
          [],
          [
            item({
              id: 'bad',
              partyId: 'customer',
              direction: 'receivable',
              originalAmountChetrum: 10_000,
              outstandingAmountChetrum: 20_000,
            }),
          ],
        ),
    ).toThrow(
      'cannot exceed its original amount',
    )
  })
})