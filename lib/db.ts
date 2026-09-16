export const DB_NAME = 'money-saathi'
export const DB_VERSION = 2

export type StoreName = 'transactions' | 'categories' | 'budgets' | 'recurring' | 'settings' | 'audit'

export function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Private storage is unavailable on this device.'))
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error || new Error('Could not open private storage.'))
    request.onblocked = () => reject(new Error('Close another Money Saathi tab to update private storage.'))
    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of ['transactions', 'categories', 'budgets', 'recurring', 'settings', 'audit'] as StoreName[]) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: store === 'settings' ? 'key' : 'id' })
      }
    }
    request.onsuccess = () => {
      const db = request.result
      db.onversionchange = () => db.close()
      resolve(db)
    }
  })
}

function committed(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error || new Error('Private storage write failed.'))
    transaction.onabort = () => reject(transaction.error || new Error('Private storage write was aborted.'))
  })
}

export async function readStore<T>(store: StoreName): Promise<T[]> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readonly').objectStore(store).getAll()
    request.onsuccess = () => resolve(request.result as T[])
    request.onerror = () => reject(request.error)
  })
}

export async function writeStore<T extends { id?: string | number; key?: string }>(store: StoreName, value: T): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction(store, 'readwrite')
  transaction.objectStore(store).put(value)
  return committed(transaction)
}

export async function deleteFromStore(store: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction(store, 'readwrite')
  transaction.objectStore(store).delete(key)
  return committed(transaction)
}

export async function clearStore(store: StoreName): Promise<void> {
  const db = await openDatabase()
  const transaction = db.transaction(store, 'readwrite')
  transaction.objectStore(store).clear()
  return committed(transaction)
}

export async function replaceStores(values: Partial<Record<StoreName, Array<Record<string, unknown>>>>): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const names = Object.keys(values) as StoreName[]
    const transaction = db.transaction(names, 'readwrite')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error || new Error('Restore transaction aborted.'))
    try {
      for (const name of names) {
        const objectStore = transaction.objectStore(name)
        objectStore.clear()
        for (const value of values[name] || []) objectStore.put(value)
      }
    } catch (error) {
      transaction.abort()
      reject(error instanceof Error ? error : new Error('Restore transaction failed.'))
    }
  })
}
