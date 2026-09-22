import type { Budget } from '../types/budget'
import type { MoneyTransaction } from '../types/transaction'

const DATABASE_NAME = 'money-saathi'
const DATABASE_VERSION = 2

const TRANSACTION_STORE = 'transactions'
const BUDGET_STORE = 'budgets'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      DATABASE_NAME,
      DATABASE_VERSION,
    )

    request.onerror = () => {
      reject(
        request.error ??
          new Error('Could not open Money Saathi database'),
      )
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(TRANSACTION_STORE)) {
        const transactionStore = database.createObjectStore(
          TRANSACTION_STORE,
          {
            keyPath: 'id',
          },
        )

        transactionStore.createIndex(
          'date',
          'date',
          {
            unique: false,
          },
        )

        transactionStore.createIndex(
          'createdAt',
          'createdAt',
          {
            unique: false,
          },
        )
      }

      if (!database.objectStoreNames.contains(BUDGET_STORE)) {
        const budgetStore = database.createObjectStore(
          BUDGET_STORE,
          {
            keyPath: 'id',
          },
        )

        budgetStore.createIndex(
          'month',
          'month',
          {
            unique: false,
          },
        )

        budgetStore.createIndex(
          'category',
          'category',
          {
            unique: false,
          },
        )
      }
    }
  })
}

function waitForTransaction(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()

    transaction.onerror = () => {
      reject(
        transaction.error ??
          new Error('Database transaction failed'),
      )
    }

    transaction.onabort = () => {
      reject(
        transaction.error ??
          new Error('Database transaction was cancelled'),
      )
    }
  })
}

export async function getTransactions(): Promise<
  MoneyTransaction[]
> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      TRANSACTION_STORE,
      'readonly',
    )

    const store = transaction.objectStore(
      TRANSACTION_STORE,
    )

    const request = store.getAll()

    const records = await new Promise<
      MoneyTransaction[]
    >((resolve, reject) => {
      request.onsuccess = () => {
        resolve(
          request.result as MoneyTransaction[],
        )
      }

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Could not read transactions',
            ),
        )
      }
    })

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

export async function addTransaction(
  record: MoneyTransaction,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      TRANSACTION_STORE,
      'readwrite',
    )

    transaction
      .objectStore(TRANSACTION_STORE)
      .add(record)

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

    transaction
      .objectStore(TRANSACTION_STORE)
      .put(record)

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

    transaction
      .objectStore(TRANSACTION_STORE)
      .delete(id)

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

    const record = await new Promise<
      MoneyTransaction | undefined
    >((resolve, reject) => {
      request.onsuccess = () => {
        resolve(
          request.result as
            | MoneyTransaction
            | undefined,
        )
      }

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Could not read transaction',
            ),
        )
      }
    })

    await waitForTransaction(transaction)

    return record
  } finally {
    database.close()
  }
}

export async function getBudgets(
  month: string,
): Promise<Budget[]> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUDGET_STORE,
      'readonly',
    )

    const store = transaction.objectStore(
      BUDGET_STORE,
    )

    const index = store.index('month')
    const request = index.getAll(month)

    const budgets = await new Promise<
      Budget[]
    >((resolve, reject) => {
      request.onsuccess = () => {
        resolve(
          request.result as Budget[],
        )
      }

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Could not read budgets',
            ),
        )
      }
    })

    await waitForTransaction(transaction)

    return budgets.sort((a, b) =>
      a.category.localeCompare(b.category),
    )
  } finally {
    database.close()
  }
}

export async function upsertBudget(
  budget: Budget,
): Promise<void> {
  const database = await openDatabase()

  try {
    const transaction = database.transaction(
      BUDGET_STORE,
      'readwrite',
    )

    transaction
      .objectStore(BUDGET_STORE)
      .put(budget)

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

    transaction
      .objectStore(BUDGET_STORE)
      .delete(id)

    await waitForTransaction(transaction)
  } finally {
    database.close()
  }
}
