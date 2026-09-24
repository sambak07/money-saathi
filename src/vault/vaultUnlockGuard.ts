export const VAULT_UNLOCK_MAX_FAILURES =
  5

export const VAULT_UNLOCK_BASE_COOLDOWN_MS =
  60 * 1000

export const VAULT_UNLOCK_MAX_COOLDOWN_MS =
  15 * 60 * 1000

const STORAGE_KEY =
  'money-saathi:vault-unlock-guard:v1'

interface StoredUnlockGuard {
  version: 1
  failedAttempts: number
  cooldownLevel: number
  cooldownUntil: number
}

export interface VaultUnlockGuardStatus {
  blocked: boolean
  failedAttempts: number
  failuresRemaining: number
  cooldownUntil: number
  remainingMs: number
}

const EMPTY_STATE: StoredUnlockGuard = {
  version: 1,
  failedAttempts: 0,
  cooldownLevel: 0,
  cooldownUntil: 0,
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function sanitizeState(
  value: unknown,
): StoredUnlockGuard {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Number.isSafeInteger(
      value.failedAttempts,
    ) ||
    Number(value.failedAttempts) < 0 ||
    Number(value.failedAttempts) >=
      VAULT_UNLOCK_MAX_FAILURES ||
    !Number.isSafeInteger(
      value.cooldownLevel,
    ) ||
    Number(value.cooldownLevel) < 0 ||
    !Number.isFinite(
      value.cooldownUntil,
    ) ||
    Number(value.cooldownUntil) < 0
  ) {
    return {
      ...EMPTY_STATE,
    }
  }

  return {
    version: 1,
    failedAttempts:
      Number(
        value.failedAttempts,
      ),
    cooldownLevel:
      Number(
        value.cooldownLevel,
      ),
    cooldownUntil:
      Number(
        value.cooldownUntil,
      ),
  }
}

function readState():
  StoredUnlockGuard {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      )

    if (!raw) {
      return {
        ...EMPTY_STATE,
      }
    }

    return sanitizeState(
      JSON.parse(raw),
    )
  } catch {
    return {
      ...EMPTY_STATE,
    }
  }
}

function writeState(
  state: StoredUnlockGuard,
): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state),
  )
}

function cooldownDuration(
  level: number,
): number {
  if (level <= 1) {
    return VAULT_UNLOCK_BASE_COOLDOWN_MS
  }

  if (level === 2) {
    return 5 * 60 * 1000
  }

  return VAULT_UNLOCK_MAX_COOLDOWN_MS
}

export function getVaultUnlockGuard(
  now = Date.now(),
): VaultUnlockGuardStatus {
  const state =
    readState()

  const remainingMs =
    Math.max(
      0,
      state.cooldownUntil -
        now,
    )

  const blocked =
    remainingMs > 0

  return {
    blocked,
    failedAttempts:
      state.failedAttempts,
    failuresRemaining:
      Math.max(
        0,
        VAULT_UNLOCK_MAX_FAILURES -
          state.failedAttempts,
      ),
    cooldownUntil:
      state.cooldownUntil,
    remainingMs,
  }
}

export function recordVaultUnlockFailure(
  now = Date.now(),
): VaultUnlockGuardStatus {
  const state =
    readState()

  if (
    state.cooldownUntil >
    now
  ) {
    return getVaultUnlockGuard(
      now,
    )
  }

  const failedAttempts =
    state.failedAttempts + 1

  if (
    failedAttempts <
    VAULT_UNLOCK_MAX_FAILURES
  ) {
    writeState({
      ...state,
      failedAttempts,
      cooldownUntil: 0,
    })

    return getVaultUnlockGuard(
      now,
    )
  }

  const cooldownLevel =
    Math.min(
      3,
      state.cooldownLevel + 1,
    )

  const cooldownUntil =
    now +
    cooldownDuration(
      cooldownLevel,
    )

  writeState({
    version: 1,
    failedAttempts: 0,
    cooldownLevel,
    cooldownUntil,
  })

  return getVaultUnlockGuard(
    now,
  )
}

export function resetVaultUnlockGuard():
  void {
  localStorage.removeItem(
    STORAGE_KEY,
  )
}

export function formatVaultUnlockCooldown(
  remainingMs: number,
): string {
  const seconds =
    Math.max(
      1,
      Math.ceil(
        remainingMs /
          1000,
      ),
    )

  if (
    seconds < 60
  ) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`
  }

  const minutes =
    Math.ceil(
      seconds /
        60,
    )

  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}