import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../components/money-saathi/app-shell.tsx', import.meta.url), 'utf8') + readFileSync(new URL('../components/money-saathi/budget-view.tsx', import.meta.url), 'utf8')

describe('production source regressions', () => {
  it('passes the preferred name through onboarding completion', () => {
    expect(source).toContain('onComplete={(balance, protect, displayName, selectedUserType) => completeOnboarding(balance, protect, displayName, selectedUserType)}')
  })

  it('keeps My Money asset deletion behind an explicit confirmation dialog', () => {
    expect(source).toContain("function removeAsset(asset: FinancialAsset) { setDialog({ kind: 'asset', id: asset.id }) }")
    expect(source).toContain('async function confirmRemoveAsset()')
    const deleteIntent = source.match(/onDelete=\{removeAsset\}/)?.[0] || ''
    expect(deleteIntent).toBe('onDelete={removeAsset}')
    expect(deleteIntent).not.toContain('financialAssetsRepository.remove(')
  })

  it('never turns My Money asset edits into transactions', () => {
    expect(source).toContain('financialAssetsRepository.save(asset)')
    const addAsset = source.match(/async function addAsset\([^)]*\) \{[^\n]*/)?.[0] || ''
    expect(addAsset).not.toContain('transactionRepository.save(')
    expect(addAsset).not.toContain('createTransaction(')
  })

  it('keeps planning deletion behind confirmation handlers', () => {
    expect(source).toContain('setPendingBudget(budget)')
    expect(source).toContain('setPendingRecurring(item)')
    expect(source).toContain('async function confirmBudgetDelete()')
    expect(source).toContain('async function confirmRecurringDelete()')
    const budgetIntent = source.match(/onClick=\{\(\) => setPendingBudget\(budget\)\}/)?.[0] || ''
    const recurringIntent = source.match(/onClick=\{\(\) => setPendingRecurring\(item\)\}/)?.[0] || ''
    expect(budgetIntent).toBe('onClick={() => setPendingBudget(budget)}')
    expect(recurringIntent).toBe('onClick={() => setPendingRecurring(item)}')
    expect(budgetIntent).not.toContain('removeBudget(')
    expect(recurringIntent).not.toContain('removeRecurring(')
  })

  it('gates the plain backup behind a privacy confirmation instead of an immediate download', () => {
    // The toolbar action is clearly labelled and opens a dialog rather than downloading.
    expect(source).toContain('Download unencrypted backup')
    expect(source).toContain('onClick={requestUnencryptedBackup}')
    const plainButton = source.match(/onClick=\{requestUnencryptedBackup\}><FileArchive[^>]*\/> Download unencrypted backup<\/button>/)?.[0] || ''
    expect(plainButton).not.toContain('void backup()')
    expect(source).toContain("function requestUnencryptedBackup() { setDialog({ kind: 'unencryptedBackup' }) }")
    // The confirmation carries the required warning wording and recommends encryption.
    expect(source).toContain('Download unencrypted backup?')
    expect(source).toContain('This backup contains your Money Saathi financial records in readable JSON. Anyone who gets the file may be able to read it.')
    expect(source).toContain('For better privacy, use Encrypted backup.')
  })

  it('keeps encrypted backup available, emphasized, and never mislabels the plain backup as encrypted', () => {
    expect(source).toContain('backup-recommended')
    expect(source).toContain('void encryptedBackup()')
    expect(source).toContain('async function createEncryptedBackup()')
    // The plain-backup confirmation must not claim the ordinary backup is encrypted.
    const dialog = source.match(/Download unencrypted backup\?[\s\S]{0,400}For better privacy/)?.[0] || ''
    expect(dialog).not.toMatch(/is encrypted|will be encrypted|password-protected/i)
  })

  it('contains no native browser dialogs or dead false branches', () => {
    expect(source).not.toContain('window.prompt(')
    expect(source).not.toContain('window.confirm(')
    expect(source).not.toContain('window.alert(')
    expect(source).not.toContain('if (false)')
  })
})
