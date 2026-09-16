export const DB_NAME = 'money-saathi'
export const DB_VERSION = 1

export type StoreName = 'transactions' | 'categories' | 'budgets' | 'recurring' | 'settings'

export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const db = request.result
      for (const store of ['transactions', 'categories', 'budgets', 'recurring', 'settings'] as StoreName[]) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store, { keyPath: store === 'settings' ? 'key' : 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
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
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readwrite').objectStore(store).put(value)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function deleteFromStore(store: StoreName, key: IDBValidKey): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readwrite').objectStore(store).delete(key)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function clearStore(store: StoreName): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const request = db.transaction(store, 'readwrite').objectStore(store).clear()
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export async function replaceStores(values: Partial<Record<StoreName, Array<Record<string, unknown>>>>): Promise<void> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const names = Object.keys(values) as StoreName[]
    const transaction = db.transaction(names, 'readwrite')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error || new Error('Restore transaction aborted.'))
    for (const name of names) {
      const objectStore = transaction.objectStore(name)
      objectStore.clear()
      for (const value of values[name] || []) objectStore.put(value)
    }
  })
}
