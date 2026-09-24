import type {
  FixedDeposit,
  RecurringDeposit,
  SavingsAccount,
} from '../types/asset'
import type {
  BusinessOpenItem,
  BusinessParty,
  BusinessProfile,
  BusinessTradeEntry,
  BusinessTransaction,
} from '../types/business'
import type { Budget } from '../types/budget'
import type { Loan } from '../types/loan'
import type { FinancialScheme } from '../types/scheme'
import type { Goal, GoalContribution } from '../types/goal'
import type { RegularMoney } from '../types/regularMoney'
import type { MoneyTransaction } from '../types/transaction'

const DATABASE_NAME = 'money-saathi'
const DATABASE_VERSION = 10

const TRANSACTION_STORE = 'transactions'
const BUDGET_STORE = 'budgets'
const REGULAR_MONEY_STORE = 'regular-money'
const GOAL_STORE = 'goals'
const GOAL_CONTRIBUTION_STORE = 'goal-contributions'
const SAVINGS_STORE = 'savings-accounts'
const FIXED_DEPOSIT_STORE = 'fixed-deposits'
const RECURRING_DEPOSIT_STORE = 'recurring-deposits'
const LOAN_STORE = 'loans'
const SCHEME_STORE = 'financial-schemes'
const BUSINESS_PROFILE_STORE = 'business-profiles'
const BUSINESS_TRANSACTION_STORE = 'business-transactions'
const BUSINESS_PARTY_STORE = 'business-parties'
const BUSINESS_OPEN_ITEM_STORE = 'business-open-items'
const BUSINESS_TRADE_ENTRY_STORE = 'business-trade-entries'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onerror = () => {
      reject(
        request.error ??
          new Error('Could not open Money Saathi database'),
      )
    }

    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(TRANSACTION_STORE)) {
        const store = database.createObjectStore(
          TRANSACTION_STORE,
          { keyPath: 'id' },
        )
        store.createIndex('date', 'date', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!database.objectStoreNames.contains(BUDGET_STORE)) {
        const store = database.createObjectStore(
          BUDGET_STORE,
          { keyPath: 'id' },
        )
        store.createIndex('month', 'month', { unique: false })
        store.createIndex('category', 'category', { unique: false })
      }

      if (!database.objectStoreNames.contains(REGULAR_MONEY_STORE)) {
        const store = database.createObjectStore(
          REGULAR_MONEY_STORE,
          { keyPath: 'id' },
        )
        store.createIndex('kind', 'kind', { unique: false })
        store.createIndex('startDate', 'startDate', { unique: false })
      }

      if (!database.objectStoreNames.contains(GOAL_STORE)) {
        database.createObjectStore(GOAL_STORE, { keyPath: 'id' })
      }

      if (!database.objectStoreNames.contains(GOAL_CONTRIBUTION_STORE)) {
        const store = database.createObjectStore(
          GOAL_CONTRIBUTION_STORE,
          { keyPath: 'id' },
        )
        store.createIndex('goalId', 'goalId', { unique: false })
        store.createIndex('date', 'date', { unique: false })
      }

      if (!database.objectStoreNames.contains(SAVINGS_STORE)) {
        database.createObjectStore(SAVINGS_STORE, {
          keyPath: 'id',
        })
      }

      if (!database.objectStoreNames.contains(FIXED_DEPOSIT_STORE)) {
        database.createObjectStore(FIXED_DEPOSIT_STORE, {
          keyPath: 'id',
        })
      }

      if (!database.objectStoreNames.contains(RECURRING_DEPOSIT_STORE)) {
        database.createObjectStore(RECURRING_DEPOSIT_STORE, {
          keyPath: 'id',
        })
      }

      if (!database.objectStoreNames.contains(LOAN_STORE)) {
        database.createObjectStore(LOAN_STORE, {
          keyPath: 'id',
        })
      }

      if (!database.objectStoreNames.contains(SCHEME_STORE)) {
        database.createObjectStore(SCHEME_STORE, {
          keyPath: 'id',
        })
      }
      if (!database.objectStoreNames.contains(BUSINESS_PROFILE_STORE)) {
        database.createObjectStore(
          BUSINESS_PROFILE_STORE,
          { keyPath: 'id' },
        )
      }

      if (!database.objectStoreNames.contains(BUSINESS_TRANSACTION_STORE)) {
        const store = database.createObjectStore(
          BUSINESS_TRANSACTION_STORE,
          { keyPath: 'id' },
        )

        store.createIndex(
          'businessId',
          'businessId',
          { unique: false },
        )

        store.createIndex(
          'date',
          'date',
          { unique: false },
        )
      }

      if (!database.objectStoreNames.contains(BUSINESS_PARTY_STORE)) {
        const store = database.createObjectStore(
          BUSINESS_PARTY_STORE,
          { keyPath: 'id' },
        )

        store.createIndex(
          'businessId',
          'businessId',
          { unique: false },
        )

        store.createIndex(
          'role',
          'role',
          { unique: false },
        )
      }

      if (!database.objectStoreNames.contains(BUSINESS_OPEN_ITEM_STORE)) {
        const store = database.createObjectStore(
          BUSINESS_OPEN_ITEM_STORE,
          { keyPath: 'id' },
        )

        store.createIndex(
          'businessId',
          'businessId',
          { unique: false },
        )

        store.createIndex(
          'partyId',
          'partyId',
          { unique: false },
        )

        store.createIndex(
          'dueDate',
          'dueDate',
          { unique: false },
        )
      }

      if (!database.objectStoreNames.contains(BUSINESS_TRADE_ENTRY_STORE)) {
        const store = database.createObjectStore(
          BUSINESS_TRADE_ENTRY_STORE,
          { keyPath: 'id' },
        )

        store.createIndex(
          'businessId',
          'businessId',
          { unique: false },
        )

        store.createIndex(
          'kind',
          'kind',
          { unique: false },
        )

        store.createIndex(
          'date',
          'date',
          { unique: false },
        )
      }
    }
  })
}

function waitForTransaction(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      if (
        transaction.mode === 'readwrite' &&
        typeof window !== 'undefined'
      ) {
        window.dispatchEvent(
          new Event(
            'money-saathi-data-change',
          ),
        )
      }

      resolve()
    }
    transaction.onerror = () =>
      reject(
        transaction.error ??
          new Error('Database transaction failed'),
      )
    transaction.onabort = () =>
      reject(
        transaction.error ??
          new Error('Database transaction was cancelled'),
      )
  })
}

function getAllFromStore<T>(
  database: IDBDatabase,
  storeName: string,
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()

    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () =>
      reject(
        request.error ??
          new Error(`Could not read ${storeName}`),
      )
  })
}

export async function getTransactions(): Promise<
  MoneyTransaction[]
> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<MoneyTransaction>(
      database,
      TRANSACTION_STORE,
    )

    return records.sort((a, b) => {
      const comparison = b.date.localeCompare(a.date)
      if (comparison !== 0) return comparison
      return b.createdAt - a.createdAt
    })
  } finally {
    database.close()
  }
}

export async function addTransaction(
  record: MoneyTransaction,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      TRANSACTION_STORE,
      'readwrite',
    )
    transaction.objectStore(TRANSACTION_STORE).add(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function updateTransaction(
  record: MoneyTransaction,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      TRANSACTION_STORE,
      'readwrite',
    )
    transaction.objectStore(TRANSACTION_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteTransaction(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      TRANSACTION_STORE,
      'readwrite',
    )
    transaction.objectStore(TRANSACTION_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getTransaction(
  id: string,
): Promise<MoneyTransaction | undefined> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      TRANSACTION_STORE,
      'readonly',
    )
    const request = transaction
      .objectStore(TRANSACTION_STORE)
      .get(id)

    const record = await new Promise<MoneyTransaction | undefined>(
      (resolve, reject) => {
        request.onsuccess = () =>
          resolve(request.result as MoneyTransaction | undefined)
        request.onerror = () =>
          reject(
            request.error ??
              new Error('Could not read transaction'),
          )
      },
    )

    await waitForTransaction(transaction)
    return record
  } finally {
    database.close()
  }
}

export async function getBudgets(month: string): Promise<Budget[]> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUDGET_STORE,
      'readonly',
    )
    const request = transaction
      .objectStore(BUDGET_STORE)
      .index('month')
      .getAll(month)

    const records = await new Promise<Budget[]>(
      (resolve, reject) => {
        request.onsuccess = () =>
          resolve(request.result as Budget[])
        request.onerror = () =>
          reject(
            request.error ??
              new Error('Could not read budgets'),
          )
      },
    )

    await waitForTransaction(transaction)

    return records.sort((a, b) =>
      a.category.localeCompare(b.category),
    )
  } finally {
    database.close()
  }
}

export async function upsertBudget(
  record: Budget,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUDGET_STORE,
      'readwrite',
    )
    transaction.objectStore(BUDGET_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteBudget(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUDGET_STORE,
      'readwrite',
    )
    transaction.objectStore(BUDGET_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getRegularMoney(): Promise<
  RegularMoney[]
> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<RegularMoney>(
      database,
      REGULAR_MONEY_STORE,
    )

    return records.sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  } finally {
    database.close()
  }
}

export async function upsertRegularMoney(
  record: RegularMoney,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      REGULAR_MONEY_STORE,
      'readwrite',
    )
    transaction.objectStore(REGULAR_MONEY_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteRegularMoney(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      REGULAR_MONEY_STORE,
      'readwrite',
    )
    transaction.objectStore(REGULAR_MONEY_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getGoals(): Promise<Goal[]> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<Goal>(
      database,
      GOAL_STORE,
    )

    return records.sort((a, b) => a.createdAt - b.createdAt)
  } finally {
    database.close()
  }
}

export async function upsertGoal(
  record: Goal,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      GOAL_STORE,
      'readwrite',
    )
    transaction.objectStore(GOAL_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getGoalContributions(): Promise<
  GoalContribution[]
> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<GoalContribution>(
      database,
      GOAL_CONTRIBUTION_STORE,
    )

    return records.sort((a, b) => {
      const comparison = b.date.localeCompare(a.date)
      if (comparison !== 0) return comparison
      return b.createdAt - a.createdAt
    })
  } finally {
    database.close()
  }
}

export async function addGoalContribution(
  record: GoalContribution,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      GOAL_CONTRIBUTION_STORE,
      'readwrite',
    )
    transaction.objectStore(GOAL_CONTRIBUTION_STORE).add(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteGoalContribution(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      GOAL_CONTRIBUTION_STORE,
      'readwrite',
    )
    transaction.objectStore(GOAL_CONTRIBUTION_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteGoalWithContributions(
  goalId: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const readTransaction = database.transaction(
      GOAL_CONTRIBUTION_STORE,
      'readonly',
    )

    const keysRequest = readTransaction
      .objectStore(GOAL_CONTRIBUTION_STORE)
      .index('goalId')
      .getAllKeys(goalId)

    const keys = await new Promise<IDBValidKey[]>(
      (resolve, reject) => {
        keysRequest.onsuccess = () => resolve(keysRequest.result)
        keysRequest.onerror = () =>
          reject(
            keysRequest.error ??
              new Error('Could not find goal contributions'),
          )
      },
    )

    await waitForTransaction(readTransaction)

    const writeTransaction = database.transaction(
      [GOAL_STORE, GOAL_CONTRIBUTION_STORE],
      'readwrite',
    )

    writeTransaction.objectStore(GOAL_STORE).delete(goalId)

    const contributionStore = writeTransaction.objectStore(
      GOAL_CONTRIBUTION_STORE,
    )

    for (const key of keys) {
      contributionStore.delete(key)
    }

    await waitForTransaction(writeTransaction)
  } finally {
    database.close()
  }
}
export async function getSavingsAccounts(): Promise<
  SavingsAccount[]
> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<SavingsAccount>(
      database,
      SAVINGS_STORE,
    )

    return records.sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  } finally {
    database.close()
  }
}

export async function upsertSavingsAccount(
  record: SavingsAccount,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      SAVINGS_STORE,
      'readwrite',
    )

    transaction.objectStore(SAVINGS_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteSavingsAccount(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      SAVINGS_STORE,
      'readwrite',
    )

    transaction.objectStore(SAVINGS_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getFixedDeposits(): Promise<
  FixedDeposit[]
> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<FixedDeposit>(
      database,
      FIXED_DEPOSIT_STORE,
    )

    return records.sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  } finally {
    database.close()
  }
}

export async function upsertFixedDeposit(
  record: FixedDeposit,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      FIXED_DEPOSIT_STORE,
      'readwrite',
    )

    transaction.objectStore(FIXED_DEPOSIT_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteFixedDeposit(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      FIXED_DEPOSIT_STORE,
      'readwrite',
    )

    transaction.objectStore(FIXED_DEPOSIT_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getRecurringDeposits(): Promise<
  RecurringDeposit[]
> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<RecurringDeposit>(
      database,
      RECURRING_DEPOSIT_STORE,
    )

    return records.sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  } finally {
    database.close()
  }
}

export async function upsertRecurringDeposit(
  record: RecurringDeposit,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      RECURRING_DEPOSIT_STORE,
      'readwrite',
    )

    transaction.objectStore(RECURRING_DEPOSIT_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteRecurringDeposit(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      RECURRING_DEPOSIT_STORE,
      'readwrite',
    )

    transaction.objectStore(RECURRING_DEPOSIT_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}
export async function getLoans(): Promise<Loan[]> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<Loan>(
      database,
      LOAN_STORE,
    )

    return records.sort((a, b) =>
      a.name.localeCompare(b.name),
    )
  } finally {
    database.close()
  }
}

export async function upsertLoan(
  record: Loan,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      LOAN_STORE,
      'readwrite',
    )

    transaction.objectStore(LOAN_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteLoan(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      LOAN_STORE,
      'readwrite',
    )

    transaction.objectStore(LOAN_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}
export async function getFinancialSchemes(): Promise<
  FinancialScheme[]
> {
  const database = await openDatabase()

  try {
    const records = await getAllFromStore<FinancialScheme>(
      database,
      SCHEME_STORE,
    )

    return records.sort((a, b) => {
      const statusComparison =
        a.status.localeCompare(b.status)

      if (statusComparison !== 0) {
        return statusComparison
      }

      return a.name.localeCompare(b.name)
    })
  } finally {
    database.close()
  }
}

export async function upsertFinancialScheme(
  record: FinancialScheme,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      SCHEME_STORE,
      'readwrite',
    )

    transaction.objectStore(SCHEME_STORE).put(record)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteFinancialScheme(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      SCHEME_STORE,
      'readwrite',
    )

    transaction.objectStore(SCHEME_STORE).delete(id)
    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}
export async function getBusinessProfiles(): Promise<
  BusinessProfile[]
> {
  const database = await openDatabase()

  try {
    const records =
      await getAllFromStore<BusinessProfile>(
        database,
        BUSINESS_PROFILE_STORE,
      )

    return records.sort((a, b) =>
      a.createdAt - b.createdAt,
    )
  } finally {
    database.close()
  }
}

export async function upsertBusinessProfile(
  record: BusinessProfile,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_PROFILE_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_PROFILE_STORE)
      .put(record)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getBusinessTransactions(
  businessId: string,
): Promise<BusinessTransaction[]> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_TRANSACTION_STORE,
      'readonly',
    )

    const request = transaction
      .objectStore(BUSINESS_TRANSACTION_STORE)
      .index('businessId')
      .getAll(businessId)

    const records =
      await new Promise<BusinessTransaction[]>(
        (resolve, reject) => {
          request.onsuccess = () =>
            resolve(
              request.result as BusinessTransaction[],
            )

          request.onerror = () =>
            reject(
              request.error ??
                new Error(
                  'Could not read business transactions',
                ),
            )
        },
      )

    await waitForTransaction(transaction)

    return records.sort((a, b) => {
      const dateComparison =
        b.date.localeCompare(a.date)

      if (dateComparison !== 0) {
        return dateComparison
      }

      return b.createdAt - a.createdAt
    })
  } finally {
    database.close()
  }
}

export async function addBusinessTransaction(
  record: BusinessTransaction,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_TRANSACTION_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_TRANSACTION_STORE)
      .add(record)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function updateBusinessTransaction(
  record: BusinessTransaction,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_TRANSACTION_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_TRANSACTION_STORE)
      .put(record)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteBusinessTransaction(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_TRANSACTION_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_TRANSACTION_STORE)
      .delete(id)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getBusinessParties(
  businessId: string,
): Promise<BusinessParty[]> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_PARTY_STORE,
      'readonly',
    )

    const request = transaction
      .objectStore(BUSINESS_PARTY_STORE)
      .index('businessId')
      .getAll(businessId)

    const records =
      await new Promise<BusinessParty[]>(
        (resolve, reject) => {
          request.onsuccess = () =>
            resolve(
              request.result as BusinessParty[],
            )

          request.onerror = () =>
            reject(
              request.error ??
                new Error(
                  'Could not read business parties',
                ),
            )
        },
      )

    await waitForTransaction(transaction)

    return records.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name,
        ),
    )
  } finally {
    database.close()
  }
}

export async function upsertBusinessParty(
  record: BusinessParty,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_PARTY_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_PARTY_STORE)
      .put(record)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteBusinessParty(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const readTransaction =
      database.transaction(
        BUSINESS_OPEN_ITEM_STORE,
        'readonly',
      )

    const keysRequest =
      readTransaction
        .objectStore(
          BUSINESS_OPEN_ITEM_STORE,
        )
        .index('partyId')
        .getAllKeys(id)

    const openItemKeys =
      await new Promise<IDBValidKey[]>(
        (resolve, reject) => {
          keysRequest.onsuccess = () =>
            resolve(
              keysRequest.result,
            )

          keysRequest.onerror = () =>
            reject(
              keysRequest.error ??
                new Error(
                  'Could not find business party credit records',
                ),
            )
        },
      )

    await waitForTransaction(
      readTransaction,
    )

    const writeTransaction =
      database.transaction(
        [
          BUSINESS_PARTY_STORE,
          BUSINESS_OPEN_ITEM_STORE,
        ],
        'readwrite',
      )

    writeTransaction
      .objectStore(
        BUSINESS_PARTY_STORE,
      )
      .delete(id)

    const openItemStore =
      writeTransaction.objectStore(
        BUSINESS_OPEN_ITEM_STORE,
      )

    for (
      const key of openItemKeys
    ) {
      openItemStore.delete(
        key,
      )
    }

    await waitForTransaction(
      writeTransaction,
    )
  } finally {
    database.close()
  }
}

export async function getBusinessOpenItems(
  businessId: string,
): Promise<BusinessOpenItem[]> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_OPEN_ITEM_STORE,
      'readonly',
    )

    const request = transaction
      .objectStore(BUSINESS_OPEN_ITEM_STORE)
      .index('businessId')
      .getAll(businessId)

    const records =
      await new Promise<BusinessOpenItem[]>(
        (resolve, reject) => {
          request.onsuccess = () =>
            resolve(
              request.result as BusinessOpenItem[],
            )

          request.onerror = () =>
            reject(
              request.error ??
                new Error(
                  'Could not read business receivables and payables',
                ),
            )
        },
      )

    await waitForTransaction(transaction)

    return records.sort(
      (a, b) => {
        const aDate =
          a.dueDate ||
          a.date

        const bDate =
          b.dueDate ||
          b.date

        const comparison =
          aDate.localeCompare(
            bDate,
          )

        if (
          comparison !==
          0
        ) {
          return comparison
        }

        return a.createdAt -
          b.createdAt
      },
    )
  } finally {
    database.close()
  }
}

export async function upsertBusinessOpenItem(
  record: BusinessOpenItem,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_OPEN_ITEM_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_OPEN_ITEM_STORE)
      .put(record)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteBusinessOpenItem(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_OPEN_ITEM_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_OPEN_ITEM_STORE)
      .delete(id)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function getBusinessTradeEntries(
  businessId: string,
): Promise<BusinessTradeEntry[]> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_TRADE_ENTRY_STORE,
      'readonly',
    )

    const request = transaction
      .objectStore(BUSINESS_TRADE_ENTRY_STORE)
      .index('businessId')
      .getAll(businessId)

    const records =
      await new Promise<BusinessTradeEntry[]>(
        (resolve, reject) => {
          request.onsuccess = () =>
            resolve(
              request.result as BusinessTradeEntry[],
            )

          request.onerror = () =>
            reject(
              request.error ??
                new Error(
                  'Could not read business sales and purchases',
                ),
            )
        },
      )

    await waitForTransaction(transaction)

    return records.sort((a, b) => {
      const dateComparison =
        b.date.localeCompare(a.date)

      if (dateComparison !== 0) {
        return dateComparison
      }

      return b.createdAt - a.createdAt
    })
  } finally {
    database.close()
  }
}

export async function upsertBusinessTradeEntry(
  record: BusinessTradeEntry,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_TRADE_ENTRY_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_TRADE_ENTRY_STORE)
      .put(record)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteBusinessTradeEntry(
  id: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUSINESS_TRADE_ENTRY_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUSINESS_TRADE_ENTRY_STORE)
      .delete(id)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

export async function deleteBusinessProfileWithTransactions(
  businessId: string,
): Promise<void> {
  const database = await openDatabase()

  try {
    const readTransaction = database.transaction(
      [
        BUSINESS_TRANSACTION_STORE,
        BUSINESS_PARTY_STORE,
        BUSINESS_OPEN_ITEM_STORE,
        BUSINESS_TRADE_ENTRY_STORE,
      ],
      'readonly',
    )

    const transactionKeysRequest =
      readTransaction
        .objectStore(BUSINESS_TRANSACTION_STORE)
        .index('businessId')
        .getAllKeys(businessId)

    const partyKeysRequest =
      readTransaction
        .objectStore(BUSINESS_PARTY_STORE)
        .index('businessId')
        .getAllKeys(businessId)

    const openItemKeysRequest =
      readTransaction
        .objectStore(BUSINESS_OPEN_ITEM_STORE)
        .index('businessId')
        .getAllKeys(businessId)

    const tradeKeysRequest =
      readTransaction
        .objectStore(BUSINESS_TRADE_ENTRY_STORE)
        .index('businessId')
        .getAllKeys(businessId)

    const [
      transactionKeys,
      partyKeys,
      openItemKeys,
      tradeKeys,
    ] =
      await Promise.all([
        new Promise<IDBValidKey[]>(
          (resolve, reject) => {
            transactionKeysRequest.onsuccess = () =>
              resolve(
                transactionKeysRequest.result,
              )

            transactionKeysRequest.onerror = () =>
              reject(
                transactionKeysRequest.error ??
                  new Error(
                    'Could not find business transactions',
                  ),
              )
          },
        ),
        new Promise<IDBValidKey[]>(
          (resolve, reject) => {
            partyKeysRequest.onsuccess = () =>
              resolve(
                partyKeysRequest.result,
              )

            partyKeysRequest.onerror = () =>
              reject(
                partyKeysRequest.error ??
                  new Error(
                    'Could not find business parties',
                  ),
              )
          },
        ),
        new Promise<IDBValidKey[]>(
          (resolve, reject) => {
            openItemKeysRequest.onsuccess = () =>
              resolve(
                openItemKeysRequest.result,
              )

            openItemKeysRequest.onerror = () =>
              reject(
                openItemKeysRequest.error ??
                  new Error(
                    'Could not find business open items',
                  ),
              )
          },
        ),
        new Promise<IDBValidKey[]>(
          (resolve, reject) => {
            tradeKeysRequest.onsuccess = () =>
              resolve(
                tradeKeysRequest.result,
              )

            tradeKeysRequest.onerror = () =>
              reject(
                tradeKeysRequest.error ??
                  new Error(
                    'Could not find business sales and purchases',
                  ),
              )
          },
        ),
      ])

    await waitForTransaction(readTransaction)

    const writeTransaction = database.transaction(
      [
        BUSINESS_PROFILE_STORE,
        BUSINESS_TRANSACTION_STORE,
        BUSINESS_PARTY_STORE,
        BUSINESS_OPEN_ITEM_STORE,
        BUSINESS_TRADE_ENTRY_STORE,
      ],
      'readwrite',
    )

    writeTransaction
      .objectStore(BUSINESS_PROFILE_STORE)
      .delete(businessId)

    const transactionStore =
      writeTransaction.objectStore(
        BUSINESS_TRANSACTION_STORE,
      )

    for (
      const key of transactionKeys
    ) {
      transactionStore.delete(
        key,
      )
    }

    const partyStore =
      writeTransaction.objectStore(
        BUSINESS_PARTY_STORE,
      )

    for (
      const key of partyKeys
    ) {
      partyStore.delete(
        key,
      )
    }

    const openItemStore =
      writeTransaction.objectStore(
        BUSINESS_OPEN_ITEM_STORE,
      )

    for (
      const key of openItemKeys
    ) {
      openItemStore.delete(
        key,
      )
    }

    const tradeStore =
      writeTransaction.objectStore(
        BUSINESS_TRADE_ENTRY_STORE,
      )

    for (
      const key of tradeKeys
    ) {
      tradeStore.delete(
        key,
      )
    }

    await waitForTransaction(writeTransaction)
  } finally {
    database.close()
  }
}
export interface MoneySaathiDatabaseSnapshot {
  transactions: MoneyTransaction[]
  budgets: Budget[]
  regularMoney: RegularMoney[]
  goals: Goal[]
  goalContributions: GoalContribution[]
  savingsAccounts: SavingsAccount[]
  fixedDeposits: FixedDeposit[]
  recurringDeposits: RecurringDeposit[]
  loans: Loan[]
  financialSchemes: FinancialScheme[]
  businessProfiles: BusinessProfile[]
  businessTransactions: BusinessTransaction[]
  businessParties: BusinessParty[]
  businessOpenItems: BusinessOpenItem[]
  businessTradeEntries: BusinessTradeEntry[]
}

export async function exportDatabaseSnapshot(): Promise<
  MoneySaathiDatabaseSnapshot
> {
  const database = await openDatabase()

  try {
    const [
      transactions,
      budgets,
      regularMoney,
      goals,
      goalContributions,
      savingsAccounts,
      fixedDeposits,
      recurringDeposits,
      loans,
      financialSchemes,
      businessProfiles,
      businessTransactions,
      businessParties,
      businessOpenItems,
      businessTradeEntries,
    ] = await Promise.all([

      getAllFromStore<MoneyTransaction>(
        database,
        TRANSACTION_STORE,
      ),
      getAllFromStore<Budget>(
        database,
        BUDGET_STORE,
      ),
      getAllFromStore<RegularMoney>(
        database,
        REGULAR_MONEY_STORE,
      ),
      getAllFromStore<Goal>(
        database,
        GOAL_STORE,
      ),
      getAllFromStore<GoalContribution>(
        database,
        GOAL_CONTRIBUTION_STORE,
      ),
      getAllFromStore<SavingsAccount>(
        database,
        SAVINGS_STORE,
      ),
      getAllFromStore<FixedDeposit>(
        database,
        FIXED_DEPOSIT_STORE,
      ),
      getAllFromStore<RecurringDeposit>(
        database,
        RECURRING_DEPOSIT_STORE,
      ),
      getAllFromStore<Loan>(
        database,
        LOAN_STORE,
      ),
      getAllFromStore<FinancialScheme>(
        database,
        SCHEME_STORE,
      ),
      getAllFromStore<BusinessProfile>(
        database,
        BUSINESS_PROFILE_STORE,
      ),
      getAllFromStore<BusinessTransaction>(
        database,
        BUSINESS_TRANSACTION_STORE,
      ),
      getAllFromStore<BusinessParty>(
        database,
        BUSINESS_PARTY_STORE,
      ),
      getAllFromStore<BusinessOpenItem>(
        database,
        BUSINESS_OPEN_ITEM_STORE,
      ),
      getAllFromStore<BusinessTradeEntry>(
        database,
        BUSINESS_TRADE_ENTRY_STORE,
      ),
    ])

    return {
      transactions,
      budgets,
      regularMoney,
      goals,
      goalContributions,
      savingsAccounts,
      fixedDeposits,
      recurringDeposits,
      loans,
      financialSchemes,
      businessProfiles,
      businessTransactions,
      businessParties,
      businessOpenItems,
      businessTradeEntries,
    }
  } finally {
    database.close()
  }
}

export async function replaceDatabaseSnapshot(
  snapshot: MoneySaathiDatabaseSnapshot,
): Promise<void> {
  const database = await openDatabase()

  const stores = [
    TRANSACTION_STORE,
    BUDGET_STORE,
    REGULAR_MONEY_STORE,
    GOAL_STORE,
    GOAL_CONTRIBUTION_STORE,
    SAVINGS_STORE,
    FIXED_DEPOSIT_STORE,
    RECURRING_DEPOSIT_STORE,
    LOAN_STORE,
    SCHEME_STORE,
    BUSINESS_PROFILE_STORE,
    BUSINESS_TRANSACTION_STORE,
    BUSINESS_PARTY_STORE,
    BUSINESS_OPEN_ITEM_STORE,
    BUSINESS_TRADE_ENTRY_STORE,
  ]

  try {
    const transaction = database.transaction(
      stores,
      'readwrite',
    )

    const mappings: Array<
      [string, unknown[]]
    > = [
      [TRANSACTION_STORE, snapshot.transactions],
      [BUDGET_STORE, snapshot.budgets],
      [REGULAR_MONEY_STORE, snapshot.regularMoney],
      [GOAL_STORE, snapshot.goals],
      [
        GOAL_CONTRIBUTION_STORE,
        snapshot.goalContributions,
      ],
      [SAVINGS_STORE, snapshot.savingsAccounts],
      [FIXED_DEPOSIT_STORE, snapshot.fixedDeposits],
      [
        RECURRING_DEPOSIT_STORE,
        snapshot.recurringDeposits,
      ],
      [LOAN_STORE, snapshot.loans],
      [SCHEME_STORE, snapshot.financialSchemes],
      [BUSINESS_PROFILE_STORE, snapshot.businessProfiles],
      [
        BUSINESS_TRANSACTION_STORE,
        snapshot.businessTransactions,
      ],
      [
        BUSINESS_PARTY_STORE,
        snapshot.businessParties,
      ],
      [
        BUSINESS_OPEN_ITEM_STORE,
        snapshot.businessOpenItems,
      ],
      [
        BUSINESS_TRADE_ENTRY_STORE,
        snapshot.businessTradeEntries,
      ],
    ]

    for (const [storeName, records] of mappings) {
      const store = transaction.objectStore(storeName)
      store.clear()

      for (const record of records) {
        store.put(record)
      }
    }

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}
export async function clearAllFinancialData(): Promise<void> {
  const database = await openDatabase()

  const stores = [
    TRANSACTION_STORE,
    BUDGET_STORE,
    REGULAR_MONEY_STORE,
    GOAL_STORE,
    GOAL_CONTRIBUTION_STORE,
    SAVINGS_STORE,
    FIXED_DEPOSIT_STORE,
    RECURRING_DEPOSIT_STORE,
    LOAN_STORE,
    SCHEME_STORE,
    BUSINESS_PROFILE_STORE,
    BUSINESS_TRANSACTION_STORE,
    BUSINESS_PARTY_STORE,
    BUSINESS_OPEN_ITEM_STORE,
    BUSINESS_TRADE_ENTRY_STORE,
  ]

  try {
    const transaction = database.transaction(
      stores,
      'readwrite',
    )

    for (const storeName of stores) {
      transaction.objectStore(storeName).clear()
    }

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}

