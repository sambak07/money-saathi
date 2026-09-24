export const VAULT_IDLE_LOCK_MS =
  10 * 60 * 1000

let sessionKey: CryptoKey | null = null

export function getVaultSessionKey(): CryptoKey | null {
  return sessionKey
}

export function setVaultSessionKey(
  key: CryptoKey,
): void {
  sessionKey = key

  if (
    typeof window !==
    'undefined'
  ) {
    window.dispatchEvent(
      new Event(
        'money-saathi-vault-lock-change',
      ),
    )
  }
}

export function clearVaultSessionKey(): void {
  sessionKey = null

  if (
    typeof window !==
    'undefined'
  ) {
    window.dispatchEvent(
      new Event(
        'money-saathi-vault-lock-change',
      ),
    )
  }
}