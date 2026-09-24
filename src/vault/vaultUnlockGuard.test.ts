import {
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest'

interface StorageStub
  extends Storage {
  store: Map<string, string>
}

function createStorageStub():
  StorageStub {
  const store =
    new Map<string, string>()

  return {
    store,
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return (
        store.get(key) ??
        null
      )
    },
    key(index: number) {
      return (
        Array.from(
          store.keys(),
        )[index] ??
        null
      )
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(
      key: string,
      value: string,
    ) {
      store.set(
        key,
        value,
      )
    },
  }
}

Object.defineProperty(
  globalThis,
  'localStorage',
  {
    configurable: true,
    value:
      createStorageStub(),
  },
)

import {
  VAULT_UNLOCK_BASE_COOLDOWN_MS,
  getVaultUnlockGuard,
  recordVaultUnlockFailure,
  resetVaultUnlockGuard,
} from './vaultUnlockGuard'

describe('Vault unlock guard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('allows four failed attempts before cooldown', () => {
    const now = 1_000

    for (
      let index = 0;
      index < 4;
      index += 1
    ) {
      recordVaultUnlockFailure(
        now + index,
      )
    }

    const status =
      getVaultUnlockGuard(
        now + 10,
      )

    expect(
      status.blocked,
    ).toBe(false)

    expect(
      status.failuresRemaining,
    ).toBe(1)
  })

  it('starts a one-minute cooldown on the fifth failed attempt', () => {
    const now = 10_000

    for (
      let index = 0;
      index < 5;
      index += 1
    ) {
      recordVaultUnlockFailure(
        now + index,
      )
    }

    const status =
      getVaultUnlockGuard(
        now + 5,
      )

    expect(
      status.blocked,
    ).toBe(true)

    expect(
      status.remainingMs,
    ).toBeGreaterThanOrEqual(
      VAULT_UNLOCK_BASE_COOLDOWN_MS -
        5,
    )
  })

  it('escalates a later cooldown to five minutes', () => {
    const firstStart =
      20_000

    for (
      let index = 0;
      index < 5;
      index += 1
    ) {
      recordVaultUnlockFailure(
        firstStart + index,
      )
    }

    const afterFirstCooldown =
      firstStart +
      VAULT_UNLOCK_BASE_COOLDOWN_MS +
      100

    for (
      let index = 0;
      index < 5;
      index += 1
    ) {
      recordVaultUnlockFailure(
        afterFirstCooldown +
          index,
      )
    }

    const status =
      getVaultUnlockGuard(
        afterFirstCooldown +
          5,
      )

    expect(
      status.blocked,
    ).toBe(true)

    expect(
      status.remainingMs,
    ).toBeGreaterThan(
      4 * 60 * 1000,
    )
  })

  it('resets after a successful unlock', () => {
    recordVaultUnlockFailure(
      1_000,
    )

    resetVaultUnlockGuard()

    expect(
      getVaultUnlockGuard(
        1_100,
      ),
    ).toMatchObject({
      blocked: false,
      failedAttempts: 0,
      failuresRemaining: 5,
    })
  })
})