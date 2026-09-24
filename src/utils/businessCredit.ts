import type {
  BusinessOpenItem,
  BusinessParty,
} from '../types/business'

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

export interface BusinessCreditSummary {
  partyCount: number
  customerCount: number
  supplierCount: number
  openReceivableChetrum: number
  openPayableChetrum: number
  netOpenPositionChetrum: number
  overdueReceivableChetrum: number
  overduePayableChetrum: number
  overdueItemCount: number
  openItemCount: number
}

function assertMoney(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer.`,
    )
  }
}

function toSafeNumber(
  value: bigint,
  label: string,
): number {
  if (
    value > MAX_SAFE ||
    value < -MAX_SAFE
  ) {
    throw new Error(
      `${label} exceeds the supported money range.`,
    )
  }

  return Number(value)
}

export function summarizeBusinessCredit(
  today: string,
  parties: BusinessParty[],
  items: BusinessOpenItem[],
): BusinessCreditSummary {
  let receivable = 0n
  let payable = 0n
  let overdueReceivable = 0n
  let overduePayable = 0n
  let overdueItemCount = 0
  let openItemCount = 0

  for (
    const item of items
  ) {
    assertMoney(
      item.originalAmountChetrum,
      'Original business credit amount',
    )

    assertMoney(
      item.outstandingAmountChetrum,
      'Outstanding business credit amount',
    )

    if (
      item.outstandingAmountChetrum >
      item.originalAmountChetrum
    ) {
      throw new Error(
        'Outstanding business credit cannot exceed its original amount.',
      )
    }

    if (
      item.outstandingAmountChetrum ===
      0
    ) {
      continue
    }

    const amount =
      BigInt(
        item.outstandingAmountChetrum,
      )

    openItemCount += 1

    if (
      item.direction ===
      'receivable'
    ) {
      receivable +=
        amount
    } else {
      payable +=
        amount
    }

    const overdue =
      Boolean(
        item.dueDate,
      ) &&
      item.dueDate <
        today

    if (overdue) {
      overdueItemCount += 1

      if (
        item.direction ===
        'receivable'
      ) {
        overdueReceivable +=
          amount
      } else {
        overduePayable +=
          amount
      }
    }

    for (
      const total of [
        receivable,
        payable,
        overdueReceivable,
        overduePayable,
      ]
    ) {
      if (
        total >
        MAX_SAFE
      ) {
        throw new Error(
          'Business credit total exceeds the supported money range.',
        )
      }
    }
  }

  const customerCount =
    parties.filter(
      (party) =>
        party.role ===
          'customer' ||
        party.role ===
          'both',
    ).length

  const supplierCount =
    parties.filter(
      (party) =>
        party.role ===
          'supplier' ||
        party.role ===
          'both',
    ).length

  return {
    partyCount:
      parties.length,
    customerCount,
    supplierCount,
    openReceivableChetrum:
      toSafeNumber(
        receivable,
        'Open receivables',
      ),
    openPayableChetrum:
      toSafeNumber(
        payable,
        'Open payables',
      ),
    netOpenPositionChetrum:
      toSafeNumber(
        receivable -
        payable,
        'Net open business position',
      ),
    overdueReceivableChetrum:
      toSafeNumber(
        overdueReceivable,
        'Overdue receivables',
      ),
    overduePayableChetrum:
      toSafeNumber(
        overduePayable,
        'Overdue payables',
      ),
    overdueItemCount,
    openItemCount,
  }
}