import type {
  BusinessInventoryItem,
  BusinessOpenItem,
  BusinessParty,
  BusinessProfile,
  BusinessTradeEntry,
  BusinessTradeLine,
  BusinessTransaction,
} from '../types/business'

export const BUSINESS_PORTABLE_EXPORT_FORMAT =
  'MoneySaathiBusinessExport'

export const BUSINESS_PORTABLE_EXPORT_VERSION =
  1

export interface BusinessPortableExportData {
  business: BusinessProfile
  cashTransactions: BusinessTransaction[]
  parties: BusinessParty[]
  openItems: BusinessOpenItem[]
  tradeEntries: BusinessTradeEntry[]
  tradeLines: BusinessTradeLine[]
  inventoryItems: BusinessInventoryItem[]
}

interface BusinessPortableEnvelope
  extends BusinessPortableExportData {
  format: typeof BUSINESS_PORTABLE_EXPORT_FORMAT
  version: typeof BUSINESS_PORTABLE_EXPORT_VERSION
  exportedOn: string
  amountUnit: 'chetrum'
  quantityUnit: 'milli-unit'
}

function assertBusinessId(
  businessId: string,
  expectedBusinessId: string,
  label: string,
): void {
  if (
    businessId !==
    expectedBusinessId
  ) {
    throw new Error(
      `${label} belongs to a different business.`,
    )
  }
}

function validateData(
  data: BusinessPortableExportData,
): void {
  const businessId =
    data.business.id

  for (
    const transaction of data.cashTransactions
  ) {
    assertBusinessId(
      transaction.businessId,
      businessId,
      'Business cash transaction',
    )
  }

  for (
    const party of data.parties
  ) {
    assertBusinessId(
      party.businessId,
      businessId,
      'Business party',
    )
  }

  for (
    const item of data.openItems
  ) {
    assertBusinessId(
      item.businessId,
      businessId,
      'Business open item',
    )
  }

  for (
    const entry of data.tradeEntries
  ) {
    assertBusinessId(
      entry.businessId,
      businessId,
      'Business trade entry',
    )
  }

  for (
    const line of data.tradeLines
  ) {
    assertBusinessId(
      line.businessId,
      businessId,
      'Business trade line',
    )
  }

  for (
    const item of data.inventoryItems
  ) {
    assertBusinessId(
      item.businessId,
      businessId,
      'Business inventory item',
    )
  }
}

export function buildBusinessPortableJson(
  data: BusinessPortableExportData,
  exportedOn: string,
): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      exportedOn,
    )
  ) {
    throw new Error(
      'Business export date must use YYYY-MM-DD.',
    )
  }

  validateData(
    data,
  )

  const envelope:
    BusinessPortableEnvelope = {
      format:
        BUSINESS_PORTABLE_EXPORT_FORMAT,
      version:
        BUSINESS_PORTABLE_EXPORT_VERSION,
      exportedOn,
      amountUnit:
        'chetrum',
      quantityUnit:
        'milli-unit',
      business:
        data.business,
      cashTransactions:
        data.cashTransactions,
      parties:
        data.parties,
      openItems:
        data.openItems,
      tradeEntries:
        data.tradeEntries,
      tradeLines:
        data.tradeLines,
      inventoryItems:
        data.inventoryItems,
    }

  return JSON.stringify(
    envelope,
    null,
    2,
  )
}

export function safeBusinessJsonFileName(
  businessName: string,
  dateText: string,
): string {
  const safeBusiness =
    businessName
      .toLowerCase()
      .replace(
        /[^a-z0-9-]+/g,
        '-',
      )
      .replace(
        /^-+|-+$/g,
        '',
      )
      .slice(
        0,
        50,
      ) ||
    'business'

  const safeDate =
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateText,
    )
      ? dateText
      : 'export'

  return `money-saathi-${safeBusiness}-${safeDate}.json`
}