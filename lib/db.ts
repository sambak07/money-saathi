export const DB_NAME = 'money-saathi'
export const DB_VERSION = 4
export const STORAGE_TIMEOUT_MS = 8000

export type StoreName = 'transactions' | 'categories' | 'budgets' | 'recurring' | 'settings' | 'audit' | 'lock' | 'reminders' | 'reminderDismissals' | 'goals'
export const DB_STORE_NAMES: StoreName[] = ['transactions', 'categories', 'budgets', 'recurring', 'settings', 'audit', 'lock', 'reminders', 'reminderDismissals', 'goals']

function storageTimeout(message = 'Private storage took too long to respond.') { return new Error(message) }

export function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Private storage is unavailable on this device.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    let settled = false
    const timeout = window.setTimeout(() => { if (settled) return; settled = true; reject(storageTimeout('Private storage took too long to open.')) }, STORAGE_TIMEOUT_MS)
    const fail = (error: Error) => { if (settled) return; settled = true; window.clearTimeout(timeout); reject(error) }
    request.onerror = () => fail(new Error('Private storage could not be opened.'))
    request.onblocked = () => fail(new Error('Close other Money Saathi tabs and try again.'))
    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of DB_STORE_NAMES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: store === 'settings' || store === 'lock' || store === 'reminders' ? 'key' : 'id' })
      }
    }
    request.onsuccess = () => {
      window.clearTimeout(timeout)
      const db = request.result
      db.onversionchange = () => db.close()
      if (settled) db.close()
      else { settled = true; resolve(db) }
    }
  })
}

function transactionResult(transaction: IDBTransaction, message: string) {
  return new Promise<void>((resolve, reject) => {
    let settled = false
    const finish = (error?: Error) => { if (settled) return; settled = true; window.clearTimeout(timeout); if (error) reject(error); else resolve() }
    const timeout = window.setTimeout(() => { try { transaction.abort() } catch { finish(storageTimeout(message)) } }, STORAGE_TIMEOUT_MS)
    transaction.oncomplete = () => finish()
    transaction.onerror = () => finish(new Error(message))
    transaction.onabort = () => finish(storageTimeout(message))
  })
}

export async function readStore<T>(store: StoreName): Promise<T[]> {
  const db = await openDatabase()
  try {
    return await new Promise<T[]>((resolve, reject) => {
      let result: T[] | undefined
      let settled = false
      let transaction: IDBTransaction
      const timeout = window.setTimeout(() => { try { transaction.abort() } catch { if (!settled) { settled = true; reject(storageTimeout()) } } }, STORAGE_TIMEOUT_MS)
      const finish = (error?: Error) => { if (settled) return; settled = true; window.clearTimeout(timeout); if (error) reject(error); else resolve(result || []) }
      try { transaction = db.transaction(store, 'readonly'); const request = transaction.objectStore(store).getAll(); request.onsuccess = () => { result = request.result as T[] }; request.onerror = () => finish(new Error('Private storage could not read this data.')); transaction.oncomplete = () => finish(); transaction.onerror = () => finish(new Error('Private storage could not read this data.')); transaction.onabort = () => finish(storageTimeout()) } catch { finish(new Error('Private storage could not read this data.')) }
    })
  } finally { db.close() }
}

async function runWrite(store: StoreName, operation: (objectStore: IDBObjectStore) => void, message: string) {
  const db = await openDatabase()
  try {
    const transaction = db.transaction(store, 'readwrite')
    operation(transaction.objectStore(store))
    await transactionResult(transaction, message)
  } catch (error) { throw error instanceof Error ? error : new Error(message) } finally { db.close() }
}

export function writeStore<T extends { id?: string | number; key?: string }>(store: StoreName, value: T): Promise<void> { return runWrite(store, objectStore => objectStore.put(value), 'Private storage could not save this data.') }
export function deleteFromStore(store: StoreName, key: IDBValidKey): Promise<void> { return runWrite(store, objectStore => objectStore.delete(key), 'Private storage could not delete this data.') }
export function clearStore(store: StoreName): Promise<void> { return runWrite(store, objectStore => objectStore.clear(), 'Private storage could not clear this data.') }

export async function replaceStores(values: Partial<Record<StoreName, Array<Record<string, unknown>>>>): Promise<void> {
  const db = await openDatabase()
  try {
    const names = Object.keys(values) as StoreName[]
    const transaction = db.transaction(names, 'readwrite')
    for (const name of names) {
      const objectStore = transaction.objectStore(name)
      objectStore.clear()
      for (const value of values[name] || []) objectStore.put(value)
    }
    await transactionResult(transaction, 'Private storage could not finish replacing data.')
  } catch (error) { throw error instanceof Error ? error : new Error('Private storage could not finish replacing data.') } finally { db.close() }
}

export function storageErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes('Close other')) return error.message
  if (error instanceof Error && error.message.includes('too long')) return 'Private storage took too long to respond.'
  if (error instanceof Error && error.message.includes('unavailable')) return error.message
  return 'Money Saathi could not open private storage. Your financial data has not been deleted.'
}
