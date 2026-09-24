import type {
  EncryptedVaultRecord,
  VaultConfig,
} from '../types/vault'

const VAULT_DATABASE_NAME =
  'money-saathi-vault'

const VAULT_DATABASE_VERSION = 1

const META_STORE = 'meta'
const RECORD_STORE = 'records'
const CONFIG_KEY = 'config'

interface StoredVaultConfig {
  id: typeof CONFIG_KEY
  value: VaultConfig
}

function openVaultDatabase(): Promise<IDBDatabase> {
  return new Promise(
    (resolve, reject) => {
      const request =
        indexedDB.open(
          VAULT_DATABASE_NAME,
          VAULT_DATABASE_VERSION,
        )

      request.onerror = () => {
        reject(
          request.error ??
            new Error(
              'Could not open Money Vault.',
            ),
        )
      }

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onupgradeneeded = () => {
        const database =
          request.result

        if (
          !database.objectStoreNames
            .contains(META_STORE)
        ) {
          database.createObjectStore(
            META_STORE,
            {
              keyPath: 'id',
            },
          )
        }

        if (
          !database.objectStoreNames
            .contains(RECORD_STORE)
        ) {
          const store =
            database.createObjectStore(
              RECORD_STORE,
              {
                keyPath: 'id',
              },
            )

          store.createIndex(
            'updatedAt',
            'updatedAt',
            {
              unique: false,
            },
          )
        }
      }
    },
  )
}

function waitForTransaction(
  transaction: IDBTransaction,
): Promise<void> {
  return new Promise(
    (resolve, reject) => {
      transaction.oncomplete = () => {
        if (
          transaction.mode ===
            'readwrite' &&
          typeof window !==
            'undefined'
        ) {
          window.dispatchEvent(
            new Event(
              'money-saathi-vault-change',
            ),
          )
        }

        resolve()
      }

      transaction.onerror = () => {
        reject(
          transaction.error ??
            new Error(
              'Money Vault transaction failed.',
            ),
        )
      }

      transaction.onabort = () => {
        reject(
          transaction.error ??
            new Error(
              'Money Vault transaction was cancelled.',
            ),
        )
      }
    },
  )
}

export async function getVaultConfig(): Promise<
  VaultConfig | null
> {
  const database =
    await openVaultDatabase()

  try {
    const transaction =
      database.transaction(
        META_STORE,
        'readonly',
      )

    const request =
      transaction
        .objectStore(META_STORE)
        .get(CONFIG_KEY)

    const stored =
      await new Promise<
        StoredVaultConfig | undefined
      >((resolve, reject) => {
        request.onsuccess = () => {
          resolve(
            request.result as
              | StoredVaultConfig
              | undefined,
          )
        }

        request.onerror = () => {
          reject(
            request.error ??
              new Error(
                'Could not read Money Vault configuration.',
              ),
          )
        }
      })

    await waitForTransaction(
      transaction,
    )

    return stored?.value ?? null
  } finally {
    database.close()
  }
}

export async function saveVaultConfig(
  config: VaultConfig,
): Promise<void> {
  const database =
    await openVaultDatabase()

  try {
    const transaction =
      database.transaction(
        META_STORE,
        'readwrite',
      )

    transaction
      .objectStore(META_STORE)
      .put({
        id: CONFIG_KEY,
        value: config,
      } satisfies StoredVaultConfig)

    await waitForTransaction(
      transaction,
    )
  } finally {
    database.close()
  }
}

export async function getEncryptedVaultRecords(): Promise<
  EncryptedVaultRecord[]
> {
  const database =
    await openVaultDatabase()

  try {
    const transaction =
      database.transaction(
        RECORD_STORE,
        'readonly',
      )

    const request =
      transaction
        .objectStore(RECORD_STORE)
        .getAll()

    const records =
      await new Promise<
        EncryptedVaultRecord[]
      >((resolve, reject) => {
        request.onsuccess = () => {
          resolve(
            request.result as
              EncryptedVaultRecord[],
          )
        }

        request.onerror = () => {
          reject(
            request.error ??
              new Error(
                'Could not read Money Vault records.',
              ),
          )
        }
      })

    await waitForTransaction(
      transaction,
    )

    return records.sort(
      (a, b) =>
        b.updatedAt -
        a.updatedAt,
    )
  } finally {
    database.close()
  }
}

export async function upsertEncryptedVaultRecord(
  record: EncryptedVaultRecord,
): Promise<void> {
  const database =
    await openVaultDatabase()

  try {
    const transaction =
      database.transaction(
        RECORD_STORE,
        'readwrite',
      )

    transaction
      .objectStore(RECORD_STORE)
      .put(record)

    await waitForTransaction(
      transaction,
    )
  } finally {
    database.close()
  }
}

export async function deleteEncryptedVaultRecord(
  id: string,
): Promise<void> {
  const database =
    await openVaultDatabase()

  try {
    const transaction =
      database.transaction(
        RECORD_STORE,
        'readwrite',
      )

    transaction
      .objectStore(RECORD_STORE)
      .delete(id)

    await waitForTransaction(
      transaction,
    )
  } finally {
    database.close()
  }
}

export async function clearVaultStorage(): Promise<void> {
  const database =
    await openVaultDatabase()

  try {
    const transaction =
      database.transaction(
        [
          META_STORE,
          RECORD_STORE,
        ],
        'readwrite',
      )

    transaction
      .objectStore(META_STORE)
      .clear()

    transaction
      .objectStore(RECORD_STORE)
      .clear()

    await waitForTransaction(
      transaction,
    )
  } finally {
    database.close()
  }
}
export async function replaceVaultStorage(
  config: VaultConfig,
  records: EncryptedVaultRecord[],
): Promise<void> {
  const database =
    await openVaultDatabase()

  try {
    const transaction =
      database.transaction(
        [
          META_STORE,
          RECORD_STORE,
        ],
        'readwrite',
      )

    const metaStore =
      transaction.objectStore(
        META_STORE,
      )

    const recordStore =
      transaction.objectStore(
        RECORD_STORE,
      )

    metaStore.clear()
    recordStore.clear()

    metaStore.put({
      id: CONFIG_KEY,
      value: config,
    } satisfies StoredVaultConfig)

    for (
      const record of records
    ) {
      recordStore.put(
        record,
      )
    }

    await waitForTransaction(
      transaction,
    )
  } finally {
    database.close()
  }
}