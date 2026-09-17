import { describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { createStores, DB_NAME } from './db'

// The v4 store set that existed before the My Money (v5) migration.
const V4_STORES = ['transactions', 'categories', 'budgets', 'recurring', 'settings', 'audit', 'lock', 'reminders', 'reminderDismissals', 'goals']
const keyPathFor = (store: string) => (store === 'settings' || store === 'lock' || store === 'reminders' ? 'key' : 'id')

function openDb(idb: IDBFactory, version: number, upgrade: (db: IDBDatabase) => void): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = idb.open(DB_NAME, version)
    request.onupgradeneeded = () => upgrade(request.result)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
function put(db: IDBDatabase, store: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => { const tx = db.transaction(store, 'readwrite'); tx.objectStore(store).put(value); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error) })
}
function getAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => { const tx = db.transaction(store, 'readonly'); const req = tx.objectStore(store).getAll(); req.onsuccess = () => resolve(req.result as T[]); req.onerror = () => reject(req.error) })
}

describe('IndexedDB v4 -> v5 migration', () => {
  it('adds the financialAssets store while preserving every existing v4 record', async () => {
    const idb = new IDBFactory()
    const transaction = { id: 't1', type: 'expense', amountChetrum: 5000, categoryId: 'food', date: '2026-09-01', paymentMethod: 'Cash', note: 'Groceries', isRecurring: false, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }
    const settings = { key: 'app', openingBalanceChetrum: 60000000, currency: 'BTN', sampleData: false, displayName: 'Sonam', onboardingComplete: true }
    const goal = { id: 'g1', name: 'Emergency', targetChetrum: 10000000, savedChetrum: 2000000, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z' }

    const v4 = await openDb(idb, 4, db => { for (const store of V4_STORES) db.createObjectStore(store, { keyPath: keyPathFor(store) }) })
    await put(v4, 'transactions', transaction)
    await put(v4, 'settings', settings)
    await put(v4, 'goals', goal)
    v4.close()

    const v5 = await openDb(idb, 5, createStores)
    try {
      expect(v5.objectStoreNames.contains('financialAssets')).toBe(true)
      expect(v5.version).toBe(5)
      expect(await getAll(v5, 'transactions')).toEqual([transaction])
      expect(await getAll(v5, 'settings')).toEqual([settings])
      expect(await getAll(v5, 'goals')).toEqual([goal])
      expect(await getAll(v5, 'financialAssets')).toEqual([])

      const asset = { id: 's1', type: 'savings-account', name: 'Druk PNB Savings', institution: 'Druk PNB Bank', currentValueChetrum: 12540000, createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:00:00.000Z' }
      await put(v5, 'financialAssets', asset)
      expect(await getAll(v5, 'financialAssets')).toEqual([asset])
      expect(await getAll(v5, 'transactions')).toEqual([transaction])
    } finally { v5.close() }
  })
})
