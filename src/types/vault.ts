export const VAULT_KINDS = [
  'account',
  'deposit',
  'loan',
  'insurance',
  'investment',
] as const

export type VaultKind =
  (typeof VAULT_KINDS)[number]

export interface VaultEntry {
  id: string
  kind: VaultKind
  title: string
  institution: string
  referenceNumber: string
  importantDate: string
  notes: string
  createdAt: number
  updatedAt: number
}

export interface EncryptedVaultRecord {
  id: string
  version: 1
  iv: string
  ciphertext: string
  createdAt: number
  updatedAt: number
}

export interface VaultConfig {
  version: 1
  salt: string
  verifierIv: string
  verifierCiphertext: string
  createdAt: number
}