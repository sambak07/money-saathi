import type {
  MoneySaathiDatabaseSnapshot,
} from '../storage/db'
import {
  isValidDurableSettingsBackup,
  type DurableSettingsBackup,
} from './durableSettings'

export const BACKUP_FORMAT = 'MoneySaathiBackup'
export const BACKUP_VERSION = 1
export const BACKUP_AAD = 'MoneySaathiBackup:v1'
export const BACKUP_MAX_BYTES = 25 * 1024 * 1024
export const BACKUP_MAX_MEGABYTES = 25

const PBKDF2_ITERATIONS = 600_000
const SALT_BYTES = 16
const IV_BYTES = 12

export interface MoneySaathiBackupPayload {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  data: MoneySaathiDatabaseSnapshot
  settings?: DurableSettingsBackup
}

export interface EncryptedBackupEnvelope {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  encryption: {
    algorithm: 'AES-GCM-256'
    kdf: 'PBKDF2-SHA-256'
    iterations: number
    salt: string
    iv: string
    aad: typeof BACKUP_AAD
  }
  ciphertext: string
}

export interface BackupSummary {
  exportedAt: string
  totalRecords: number
  transactions: number
  budgets: number
  regularMoney: number
  goals: number
  goalContributions: number
  savingsAccounts: number
  fixedDeposits: number
  recurringDeposits: number
  loans: number
  financialSchemes: number
  businessProfiles: number
  businessTransactions: number
  businessParties: number
  businessOpenItems: number
  businessTradeEntries: number
  businessInventoryItems: number
  businessTradeLines: number
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(new TextEncoder().encode(password)),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations,
    },
    material,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MAX_TEXT_LENGTH = 20_000
const MAX_ID_LENGTH = 500

function isValidDateText(value: string): boolean {
  if (value === '') return true
  if (!DATE_PATTERN.test(value)) return false

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function isValidBackupRecord(
  value: unknown,
): value is Record<string, unknown> & { id: string } {
  if (!isRecord(value)) return false

  if (
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    value.id.length > MAX_ID_LENGTH
  ) {
    return false
  }

  for (const [key, field] of Object.entries(value)) {
    if (
      typeof field === 'string' &&
      field.length > MAX_TEXT_LENGTH
    ) {
      return false
    }

    if (
      (
        key.endsWith('Chetrum') ||
        key.endsWith('Bps') ||
        key.endsWith('Months') ||
        key === 'installmentsPaid' ||
        key === 'createdAt' ||
        key === 'updatedAt'
      ) &&
      (
        typeof field !== 'number' ||
        !Number.isSafeInteger(field) ||
        field < 0
      )
    ) {
      return false
    }

    if (
      (
        key === 'date' ||
        key.endsWith('Date') ||
        key === 'scheduledFor'
      ) &&
      field !== undefined &&
      (
        typeof field !== 'string' ||
        !isValidDateText(field)
      )
    ) {
      return false
    }
  }

  if (
    'kind' in value &&
    value.kind !== 'income' &&
    value.kind !== 'expense' &&
    value.kind !== 'sale' &&
    value.kind !== 'purchase'
  ) {
    return false
  }

  if (
    'frequency' in value &&
    value.frequency !== 'weekly' &&
    value.frequency !== 'monthly' &&
    value.frequency !== 'yearly'
  ) {
    return false
  }

  if (
    'contributionFrequency' in value &&
    ![
      'monthly',
      'quarterly',
      'half-yearly',
      'yearly',
      'irregular',
      'none',
    ].includes(String(value.contributionFrequency))
  ) {
    return false
  }

  if (
    'status' in value &&
    ![
      'active',
      'paused',
      'matured',
      'closed',
    ].includes(String(value.status))
  ) {
    return false
  }

  return true
}

function isValidCollection(
  value: unknown,
): value is Record<string, unknown>[] {
  if (!Array.isArray(value)) return false

  const ids = new Set<string>()

  for (const item of value) {
    if (!isValidBackupRecord(item)) {
      return false
    }

    if (ids.has(item.id)) {
      return false
    }

    ids.add(item.id)
  }

  return true
}

function isNonEmptyText(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= MAX_TEXT_LENGTH
  )
}

function isText(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value.length <= MAX_TEXT_LENGTH
  )
}

function isSafeNonNegativeInteger(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0
  )
}

function isSafePositiveInteger(
  value: unknown,
): value is number {
  return (
    isSafeNonNegativeInteger(value) &&
    value > 0
  )
}

function isRequiredDate(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    value !== '' &&
    isValidDateText(value)
  )
}

function isOptionalDate(
  value: unknown,
): value is string {
  return (
    typeof value === 'string' &&
    isValidDateText(value)
  )
}

function hasValidTimes(
  value: Record<string, unknown>,
  requireUpdated = true,
): boolean {
  return (
    isSafeNonNegativeInteger(
      value.createdAt,
    ) &&
    (
      !requireUpdated ||
      isSafeNonNegativeInteger(
        value.updatedAt,
      )
    )
  )
}

function isValidTransaction(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  const recurrenceValid =
    (
      value.recurringSourceId === undefined &&
      value.scheduledFor === undefined
    ) ||
    (
      isNonEmptyText(
        value.recurringSourceId,
      ) &&
      isRequiredDate(
        value.scheduledFor,
      )
    )

  return (
    (
      value.kind === 'income' ||
      value.kind === 'expense'
    ) &&
    isSafePositiveInteger(
      value.amountChetrum,
    ) &&
    isNonEmptyText(
      value.category,
    ) &&
    isText(
      value.note,
    ) &&
    isRequiredDate(
      value.date,
    ) &&
    hasValidTimes(
      value,
    ) &&
    recurrenceValid
  )
}

function isValidBudget(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    typeof value.month === 'string' &&
    /^\d{4}-\d{2}$/.test(
      value.month,
    ) &&
    isRequiredDate(
      `${value.month}-01`,
    ) &&
    isNonEmptyText(
      value.category,
    ) &&
    isSafePositiveInteger(
      value.limitChetrum,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidRegularMoney(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.name,
    ) &&
    (
      value.kind === 'income' ||
      value.kind === 'expense'
    ) &&
    isSafePositiveInteger(
      value.amountChetrum,
    ) &&
    isNonEmptyText(
      value.category,
    ) &&
    (
      value.frequency === 'weekly' ||
      value.frequency === 'monthly' ||
      value.frequency === 'yearly'
    ) &&
    isRequiredDate(
      value.startDate,
    ) &&
    isOptionalDate(
      value.endDate,
    ) &&
    (
      value.endDate === '' ||
      String(value.endDate) >=
        String(value.startDate)
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidGoal(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.name,
    ) &&
    isSafePositiveInteger(
      value.targetChetrum,
    ) &&
    isOptionalDate(
      value.targetDate,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidGoalContribution(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.goalId,
    ) &&
    isSafePositiveInteger(
      value.amountChetrum,
    ) &&
    isRequiredDate(
      value.date,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
      false,
    )
  )
}

function isValidSavingsAccount(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.name,
    ) &&
    isSafeNonNegativeInteger(
      value.balanceChetrum,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidFixedDeposit(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.name,
    ) &&
    isSafePositiveInteger(
      value.principalChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.annualRateBps,
    ) &&
    isSafePositiveInteger(
      value.tenureMonths,
    ) &&
    isRequiredDate(
      value.startDate,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidRecurringDeposit(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.name,
    ) &&
    isSafePositiveInteger(
      value.installmentChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.annualRateBps,
    ) &&
    isSafePositiveInteger(
      value.tenureMonths,
    ) &&
    isSafeNonNegativeInteger(
      value.installmentsPaid,
    ) &&
    value.installmentsPaid <=
      value.tenureMonths &&
    isRequiredDate(
      value.startDate,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidLoan(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.name,
    ) &&
    isText(
      value.lender,
    ) &&
    isSafePositiveInteger(
      value.originalPrincipalChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.outstandingPrincipalChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.annualRateBps,
    ) &&
    isSafeNonNegativeInteger(
      value.emiChetrum,
    ) &&
    isSafePositiveInteger(
      value.tenureMonths,
    ) &&
    isRequiredDate(
      value.startDate,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidFinancialScheme(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  const categories = [
    'provident-fund',
    'annuity',
    'endowment',
    'education',
    'hybrid-insurance',
    'other',
  ]

  const frequencies = [
    'monthly',
    'quarterly',
    'half-yearly',
    'yearly',
    'irregular',
    'none',
  ]

  const statuses = [
    'active',
    'paused',
    'matured',
    'closed',
  ]

  return (
    isNonEmptyText(
      value.name,
    ) &&
    isText(
      value.provider,
    ) &&
    categories.includes(
      String(value.category),
    ) &&
    statuses.includes(
      String(value.status),
    ) &&
    isSafeNonNegativeInteger(
      value.contributionChetrum,
    ) &&
    frequencies.includes(
      String(
        value.contributionFrequency,
      ),
    ) &&
    isSafeNonNegativeInteger(
      value.currentValueChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.protectionCoverChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.futureBenefitChetrum,
    ) &&
    isRequiredDate(
      value.startDate,
    ) &&
    isOptionalDate(
      value.nextContributionDate,
    ) &&
    isOptionalDate(
      value.maturityDate,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidBusinessProfile(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.name,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidBusinessTransaction(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.businessId,
    ) &&
    (
      value.kind === 'income' ||
      value.kind === 'expense'
    ) &&
    isSafePositiveInteger(
      value.amountChetrum,
    ) &&
    isNonEmptyText(
      value.category,
    ) &&
    isText(
      value.note,
    ) &&
    isRequiredDate(
      value.date,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidBusinessParty(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.businessId,
    ) &&
    isNonEmptyText(
      value.name,
    ) &&
    (
      value.role === 'customer' ||
      value.role === 'supplier' ||
      value.role === 'both'
    ) &&
    isText(
      value.phone,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidBusinessOpenItem(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.businessId,
    ) &&
    isNonEmptyText(
      value.partyId,
    ) &&
    (
      value.direction === 'receivable' ||
      value.direction === 'payable'
    ) &&
    isSafePositiveInteger(
      value.originalAmountChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.outstandingAmountChetrum,
    ) &&
    Number(
      value.outstandingAmountChetrum,
    ) <=
      Number(
        value.originalAmountChetrum,
      ) &&
    isRequiredDate(
      value.date,
    ) &&
    isOptionalDate(
      value.dueDate,
    ) &&
    isText(
      value.reference,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidBusinessTradeEntry(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  const paymentMethods = [
    'cash',
    'bank',
    'credit',
    'mixed',
    'other',
  ]

  return (
    isNonEmptyText(
      value.businessId,
    ) &&
    (
      value.kind === 'sale' ||
      value.kind === 'purchase'
    ) &&
    isText(
      value.partyName,
    ) &&
    isSafePositiveInteger(
      value.totalChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.paidAtEntryChetrum,
    ) &&
    Number(
      value.paidAtEntryChetrum,
    ) <=
      Number(
        value.totalChetrum,
      ) &&
    paymentMethods.includes(
      String(
        value.paymentMethod,
      ),
    ) &&
    isRequiredDate(
      value.date,
    ) &&
    isText(
      value.reference,
    ) &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidBusinessInventoryItem(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.businessId,
    ) &&
    isNonEmptyText(
      value.name,
    ) &&
    isText(
      value.sku,
    ) &&
    isNonEmptyText(
      value.unit,
    ) &&
    isSafeNonNegativeInteger(
      value.openingQuantityMilliUnits,
    ) &&
    isSafeNonNegativeInteger(
      value.currentUnitCostChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.lowStockQuantityMilliUnits,
    ) &&
    typeof value.active ===
      'boolean' &&
    isText(
      value.note,
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidBusinessTradeLine(
  value: unknown,
): boolean {
  if (!isValidBackupRecord(value)) return false

  return (
    isNonEmptyText(
      value.businessId,
    ) &&
    isNonEmptyText(
      value.tradeEntryId,
    ) &&
    isNonEmptyText(
      value.inventoryItemId,
    ) &&
    isNonEmptyText(
      value.itemName,
    ) &&
    (
      value.kind === 'sale' ||
      value.kind === 'purchase'
    ) &&
    isSafePositiveInteger(
      value.quantityMilliUnits,
    ) &&
    isSafePositiveInteger(
      value.lineAmountChetrum,
    ) &&
    isSafeNonNegativeInteger(
      value.costOfGoodsSoldChetrum,
    ) &&
    (
      value.kind ===
        'sale' ||
      value.costOfGoodsSoldChetrum ===
        0
    ) &&
    hasValidTimes(
      value,
    )
  )
}

function isValidTypedCollection(
  value: unknown,
  validator: (
    item: unknown,
  ) => boolean,
): value is Record<string, unknown>[] {
  return (
    isValidCollection(value) &&
    value.every(
      validator,
    )
  )
}

function hasSnapshotArrays(
  value: unknown,
): value is MoneySaathiDatabaseSnapshot {
  if (!isRecord(value)) return false

  if (
    !isValidTypedCollection(
      value.transactions,
      isValidTransaction,
    ) ||
    !isValidTypedCollection(
      value.budgets,
      isValidBudget,
    ) ||
    !isValidTypedCollection(
      value.regularMoney,
      isValidRegularMoney,
    ) ||
    !isValidTypedCollection(
      value.goals,
      isValidGoal,
    ) ||
    !isValidTypedCollection(
      value.goalContributions,
      isValidGoalContribution,
    ) ||
    !isValidTypedCollection(
      value.savingsAccounts,
      isValidSavingsAccount,
    ) ||
    !isValidTypedCollection(
      value.fixedDeposits,
      isValidFixedDeposit,
    ) ||
    !isValidTypedCollection(
      value.recurringDeposits,
      isValidRecurringDeposit,
    ) ||
    !isValidTypedCollection(
      value.loans,
      isValidLoan,
    ) ||
    !isValidTypedCollection(
      value.financialSchemes,
      isValidFinancialScheme,
    ) ||
    !isValidTypedCollection(
      value.businessProfiles,
      isValidBusinessProfile,
    ) ||
    !isValidTypedCollection(
      value.businessTransactions,
      isValidBusinessTransaction,
    ) ||
    !isValidTypedCollection(
      value.businessParties,
      isValidBusinessParty,
    ) ||
    !isValidTypedCollection(
      value.businessOpenItems,
      isValidBusinessOpenItem,
    ) ||
    !isValidTypedCollection(
      value.businessTradeEntries,
      isValidBusinessTradeEntry,
    ) ||
    !isValidTypedCollection(
      value.businessInventoryItems,
      isValidBusinessInventoryItem,
    ) ||
    !isValidTypedCollection(
      value.businessTradeLines,
      isValidBusinessTradeLine,
    )
  ) {
    return false
  }

  const goalIds =
    new Set(
      value.goals.map(
        (goal) =>
          goal.id,
      ),
    )

  if (
    value.goalContributions.some(
      (contribution) =>
        !goalIds.has(
          contribution.goalId,
        ),
    )
  ) {
    return false
  }

  const businessIds =
    new Set(
      value.businessProfiles.map(
        (business) =>
          business.id,
      ),
    )

  if (
    value.businessTransactions.some(
      (transaction) =>
        !businessIds.has(
          transaction.businessId,
        ),
    )
  ) {
    return false
  }

  if (
    value.businessParties.some(
      (party) =>
        !businessIds.has(
          party.businessId,
        ),
    )
  ) {
    return false
  }

  const partyById =
    new Map(
      value.businessParties.map(
        (party) => [
          party.id,
          party,
        ],
      ),
    )

  if (
    value.businessOpenItems.some(
      (item) => {
        const party =
          partyById.get(
            item.partyId,
          )

        return (
          !businessIds.has(
            item.businessId,
          ) ||
          !party ||
          party.businessId !==
            item.businessId
        )
      },
    )
  ) {
    return false
  }

  if (
    value.businessTradeEntries.some(
      (entry) =>
        !businessIds.has(
          entry.businessId,
        ),
    )
  ) {
    return false
  }

  if (
    value.businessInventoryItems.some(
      (item) =>
        !businessIds.has(
          item.businessId,
        ),
    )
  ) {
    return false
  }

  const tradeEntryById =
    new Map(
      value.businessTradeEntries.map(
        (entry) => [
          entry.id,
          entry,
        ],
      ),
    )

  const inventoryItemById =
    new Map(
      value.businessInventoryItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    )

  if (
    value.businessTradeLines.some(
      (line) => {
        const tradeEntry =
          tradeEntryById.get(
            line.tradeEntryId,
          )

        const inventoryItem =
          inventoryItemById.get(
            line.inventoryItemId,
          )

        return (
          !tradeEntry ||
          !inventoryItem ||
          line.businessId !==
            tradeEntry.businessId ||
          line.businessId !==
            inventoryItem.businessId ||
          line.kind !==
            tradeEntry.kind
        )
      },
    )
  ) {
    return false
  }

  return true
}

export function isValidBackupPayload(
  value: unknown,
): value is MoneySaathiBackupPayload {
  if (!isRecord(value)) return false

  return (
    value.format === BACKUP_FORMAT &&
    value.version === BACKUP_VERSION &&
    typeof value.exportedAt === 'string' &&
    !Number.isNaN(
      Date.parse(
        value.exportedAt,
      ),
    ) &&
    hasSnapshotArrays(value.data) &&
    (
      value.settings === undefined ||
      isValidDurableSettingsBackup(
        value.settings,
      )
    )
  )
}

export function migrateBackupPayload(
  value: unknown,
): MoneySaathiBackupPayload | null {
  if (
    !isRecord(value) ||
    value.format !== BACKUP_FORMAT ||
    value.version !== BACKUP_VERSION ||
    !isRecord(value.data)
  ) {
    return null
  }

  const data =
    value.data

  const coreVersionOneKeys = [
    'transactions',
    'budgets',
    'regularMoney',
    'goals',
    'goalContributions',
    'savingsAccounts',
    'fixedDeposits',
    'recurringDeposits',
    'loans',
    'financialSchemes',
  ]

  if (
    !coreVersionOneKeys.every(
      (key) =>
        Array.isArray(
          data[key],
        ),
    )
  ) {
    return null
  }

  const optionalBusinessCollectionKeys = [
    'businessProfiles',
    'businessTransactions',
    'businessParties',
    'businessOpenItems',
    'businessTradeEntries',
    'businessInventoryItems',
    'businessTradeLines',
  ]

  if (
    optionalBusinessCollectionKeys.some(
      (key) =>
        data[key] !== undefined &&
        !Array.isArray(
          data[key],
        ),
    )
  ) {
    return null
  }

  const candidate: unknown = {
    ...value,
    data: {
      ...data,
      businessProfiles:
        Array.isArray(
          data.businessProfiles,
        )
          ? data.businessProfiles
          : [],
      businessTransactions:
        Array.isArray(
          data.businessTransactions,
        )
          ? data.businessTransactions
          : [],
      businessParties:
        Array.isArray(
          data.businessParties,
        )
          ? data.businessParties
          : [],
      businessOpenItems:
        Array.isArray(
          data.businessOpenItems,
        )
          ? data.businessOpenItems
          : [],
      businessTradeEntries:
        Array.isArray(
          data.businessTradeEntries,
        )
          ? data.businessTradeEntries
          : [],
      businessInventoryItems:
        Array.isArray(
          data.businessInventoryItems,
        )
          ? data.businessInventoryItems
          : [],
      businessTradeLines:
        Array.isArray(
          data.businessTradeLines,
        )
          ? data.businessTradeLines
          : [],
    },
  }

  return isValidBackupPayload(
    candidate,
  )
    ? candidate
    : null
}

export function isValidEncryptedEnvelope(
  value: unknown,
): value is EncryptedBackupEnvelope {
  if (!isRecord(value)) return false
  if (!isRecord(value.encryption)) return false

  return (
    value.format === BACKUP_FORMAT &&
    value.version === BACKUP_VERSION &&
    value.encryption.algorithm === 'AES-GCM-256' &&
    value.encryption.kdf === 'PBKDF2-SHA-256' &&
    value.encryption.iterations === PBKDF2_ITERATIONS &&
    typeof value.encryption.salt === 'string' &&
    typeof value.encryption.iv === 'string' &&
    value.encryption.aad === BACKUP_AAD &&
    typeof value.ciphertext === 'string'
  )
}

export function buildBackupSummary(
  payload: MoneySaathiBackupPayload,
): BackupSummary {
  const data = payload.data

  const counts = {
    transactions: data.transactions.length,
    budgets: data.budgets.length,
    regularMoney: data.regularMoney.length,
    goals: data.goals.length,
    goalContributions: data.goalContributions.length,
    savingsAccounts: data.savingsAccounts.length,
    fixedDeposits: data.fixedDeposits.length,
    recurringDeposits: data.recurringDeposits.length,
    loans: data.loans.length,
    financialSchemes: data.financialSchemes.length,
    businessProfiles: data.businessProfiles.length,
    businessTransactions: data.businessTransactions.length,
    businessParties: data.businessParties.length,
    businessOpenItems: data.businessOpenItems.length,
    businessTradeEntries: data.businessTradeEntries.length,
    businessInventoryItems: data.businessInventoryItems.length,
    businessTradeLines: data.businessTradeLines.length,
  }

  return {
    exportedAt: payload.exportedAt,
    totalRecords: Object.values(counts).reduce(
      (sum, count) => sum + count,
      0,
    ),
    ...counts,
  }
}

export async function encryptBackupPayload(
  payload: MoneySaathiBackupPayload,
  password: string,
): Promise<EncryptedBackupEnvelope> {
  if (password.length < 8) {
    throw new Error(
      'Backup password must contain at least eight characters.',
    )
  }

  const salt = crypto.getRandomValues(
    new Uint8Array(SALT_BYTES),
  )

  const iv = crypto.getRandomValues(
    new Uint8Array(IV_BYTES),
  )

  const key = await deriveKey(
    password,
    salt,
    PBKDF2_ITERATIONS,
  )

  const plaintext = new TextEncoder().encode(
    JSON.stringify(payload),
  )

  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(
        new TextEncoder().encode(BACKUP_AAD),
      ),
    },
    key,
    toArrayBuffer(plaintext),
  )

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    encryption: {
      algorithm: 'AES-GCM-256',
      kdf: 'PBKDF2-SHA-256',
      iterations: PBKDF2_ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv),
      aad: BACKUP_AAD,
    },
    ciphertext: bytesToBase64(
      new Uint8Array(encrypted),
    ),
  }
}

export async function decryptBackupEnvelope(
  envelope: EncryptedBackupEnvelope,
  password: string,
): Promise<MoneySaathiBackupPayload> {
  const salt = base64ToBytes(envelope.encryption.salt)
  const iv = base64ToBytes(envelope.encryption.iv)
  const ciphertext = base64ToBytes(envelope.ciphertext)

  const key = await deriveKey(
    password,
    salt,
    envelope.encryption.iterations,
  )

  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(
        new TextEncoder().encode(BACKUP_AAD),
      ),
    },
    key,
    toArrayBuffer(ciphertext),
  )

  const parsed: unknown = JSON.parse(
    new TextDecoder().decode(plaintext),
  )

  const migrated =
    migrateBackupPayload(
      parsed,
    )

  if (!migrated) {
    throw new Error(
      'The decrypted file is not a valid Money Saathi backup.',
    )
  }

  return migrated
}

export function parseEncryptedBackupText(
  text: string,
): EncryptedBackupEnvelope {
  const parsed: unknown = JSON.parse(text)

  if (!isValidEncryptedEnvelope(parsed)) {
    throw new Error(
      'This is not a supported Money Saathi encrypted backup.',
    )
  }

  return parsed
}




