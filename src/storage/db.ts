import type {
  FixedDeposit,
  RecurringDeposit,
  SavingsAccount,
} from '../types/asset'
import type { Budget } from '../types/budget'
import type { Loan } from '../types/loan'
import type { FinancialScheme } from '../types/scheme'
import type { Goal, GoalContribution } from '../types/goal'
import type { RegularMoney } from '../types/regularMoney'
import type { MoneyTransaction } from '../types/transaction'

const DATABASE_NAME = 'money-saathi'
const DATABASE_VERSION = 7

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
    }
  })
}

function waitForTransaction(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
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
