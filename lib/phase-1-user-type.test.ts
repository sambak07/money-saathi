import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { USER_TYPES } from './settings'
import { allCategories, expenseCategories, incomeCategories, validateBackup } from './finance'
import { DB_STORE_NAMES, DB_VERSION } from './db'
import { currentBalance, monthlyExpenses, monthlyIncome } from './analytics'
import type { Transaction } from './transactions'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const onboarding = read('../components/money-saathi/onboarding.tsx')
const appShell = read('../components/money-saathi/app-shell.tsx')
const chrome = read('../components/money-saathi/app-chrome.tsx')

const baseSettings = { key: 'app', currency: 'BTN', openingBalanceChetrum: 0, sampleData: false }
function makeBackup(overrides: Record<string, unknown> = {}) {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), transactions: [], settings: [{ ...baseSettings }], categories: [], budgets: [], recurring: [], ...overrides }
}
function txn(overrides: Partial<Transaction> = {}): Transaction {
  const now = new Date().toISOString()
  return { id: crypto.randomUUID(), type: 'income', amountChetrum: 10000, categoryId: 'salary', date: '2026-09-01', paymentMethod: 'Cash', note: '', isRecurring: false, createdAt: now, updatedAt: now, ...overrides }
}

describe('user type foundation', () => {
  it('1. all four UserType values are valid', () => {
    expect(USER_TYPES).toEqual(['student', 'salaried', 'individual', 'small-business'])
    for (const value of USER_TYPES) expect(() => validateBackup(makeBackup({ settings: [{ ...baseSettings, userType: value }] }))).not.toThrow()
  })

  it('2. userType is optional', () => {
    expect(() => validateBackup(makeBackup())).not.toThrow()
    const restored = validateBackup(makeBackup()) as unknown as { settings: Array<Record<string, unknown>> }
    expect('userType' in restored.settings[0]).toBe(false)
  })

  it('3. onboarding can save each user type', () => {
    for (const value of ['student', 'salaried', 'individual', 'small-business']) expect(onboarding).toContain(`value="${value}"`)
    expect(onboarding).toContain('userType')
    expect(appShell).toContain('userType: selectedUserType')
  })

  it('4. "Choose later" remains valid and saves no userType', () => {
    expect(onboarding).toContain('userType || undefined')
    expect(onboarding).toContain('<option value="">Choose later</option>')
  })

  it('5. Settings can change userType', () => {
    expect(appShell).toContain('function saveUserType')
    expect(appShell).toContain('aria-label="Main use"')
    expect(appShell).toContain('void saveUserType(')
  })

  it('6. changing userType does not touch transaction/balance logic', () => {
    const body = appShell.match(/async function saveUserType[\s\S]*?\n {2}function exitApp/)?.[0] || ''
    expect(body).toContain('saveSettings')
    expect(body).not.toContain('transactionRepository')
    expect(body).not.toContain('replaceStores')
    expect(body).not.toContain('setTransactions')
    expect(body).not.toContain('setOpeningBalance')
    // Totals are independent of any user-type value.
    const items = [txn({ type: 'income', amountChetrum: 50000 }), txn({ type: 'expense', categoryId: 'food', amountChetrum: 20000 })]
    const before = { balance: currentBalance(0, items), income: monthlyIncome(items, '2026-09'), expenses: monthlyExpenses(items, '2026-09') }
    for (const value of USER_TYPES) {
      const restored = validateBackup(makeBackup({ transactions: items, settings: [{ ...baseSettings, userType: value }] })) as unknown as { transactions: Transaction[] }
      expect({ balance: currentBalance(0, restored.transactions), income: monthlyIncome(restored.transactions, '2026-09'), expenses: monthlyExpenses(restored.transactions, '2026-09') }).toEqual(before)
    }
  })
})

describe('backup compatibility', () => {
  it('7. legacy backup without userType validates', () => {
    expect(() => validateBackup(makeBackup({ settings: [{ ...baseSettings, displayName: 'Karma', onboardingComplete: true }] }))).not.toThrow()
  })

  it('8. backup with valid userType validates', () => {
    expect(() => validateBackup(makeBackup({ settings: [{ ...baseSettings, userType: 'student', onboardingComplete: true }] }))).not.toThrow()
  })

  it('9. invalid userType is rejected', () => {
    expect(() => validateBackup(makeBackup({ settings: [{ ...baseSettings, userType: 'ceo' }] }))).toThrow('Invalid settings data.')
    expect(() => validateBackup(makeBackup({ settings: [{ ...baseSettings, userType: 42 }] }))).toThrow('Invalid settings data.')
  })

  it('10. unknown settings keys remain rejected', () => {
    expect(() => validateBackup(makeBackup({ settings: [{ ...baseSettings, mystery: true }] }))).toThrow('Invalid settings data.')
    expect(() => validateBackup(makeBackup({ mystery: true }))).toThrow('Backup contains unknown fields.')
  })

  it('backups with Pension and Insurance transactions validate', () => {
    const items = [txn({ type: 'income', categoryId: 'pension' }), txn({ type: 'expense', categoryId: 'insurance' })]
    expect(() => validateBackup(makeBackup({ transactions: items }))).not.toThrow()
  })
})

describe('storage schema is unchanged', () => {
  it('11. DB_VERSION is unchanged', () => {
    expect(DB_VERSION).toBe(5)
  })

  it('12. no new DB store added', () => {
    expect(DB_STORE_NAMES).toEqual(['transactions', 'categories', 'budgets', 'recurring', 'settings', 'audit', 'lock', 'reminders', 'reminderDismissals', 'goals', 'financialAssets'])
    expect(DB_STORE_NAMES).toHaveLength(11)
  })
})

describe('additive categories', () => {
  it('13. Pension is a valid Income category', () => {
    expect(incomeCategories.some(category => category.id === 'pension' && category.label === 'Pension')).toBe(true)
    expect(expenseCategories.some(category => category.id === 'pension')).toBe(false)
    expect(allCategories.some(category => category.id === 'pension')).toBe(true)
  })

  it('14. Insurance is a valid Expense category', () => {
    expect(expenseCategories.some(category => category.id === 'insurance' && category.label === 'Insurance')).toBe(true)
    expect(incomeCategories.some(category => category.id === 'insurance')).toBe(false)
    expect(allCategories.some(category => category.id === 'insurance')).toBe(true)
  })

  it('15. Pension affects totals exactly like other income', () => {
    const items = [txn({ type: 'income', categoryId: 'salary', amountChetrum: 30000 }), txn({ type: 'income', categoryId: 'pension', amountChetrum: 20000 })]
    expect(monthlyIncome(items, '2026-09')).toBe(50000)
    expect(currentBalance(0, items)).toBe(50000)
  })

  it('16. Insurance affects totals exactly like other expense', () => {
    const items = [txn({ type: 'expense', categoryId: 'health', amountChetrum: 30000 }), txn({ type: 'expense', categoryId: 'insurance', amountChetrum: 20000 })]
    expect(monthlyExpenses(items, '2026-09')).toBe(50000)
    expect(currentBalance(100000, items)).toBe(50000)
  })
})

describe('safe exit', () => {
  it('17. App Lock enabled shows "Lock & exit"', () => {
    expect(chrome).toContain("'Lock & exit'")
    expect(chrome).toContain('lockEnabled ?')
  })

  it('18. App Lock disabled shows "Exit to website"', () => {
    expect(chrome).toContain("'Exit to website'")
    expect(appShell).toContain('function exitApp')
    expect(appShell).toContain("router.push('/')")
    expect(appShell).toContain('if (lockRecord?.enabled) lockApp()')
  })

  it('19. no "Sign out" or "Logout" terminology introduced', () => {
    for (const source of [chrome, appShell, onboarding]) expect(source).not.toMatch(/sign ?out|log ?out|logout/i)
  })

  it('20. mobile device menu is accessible', () => {
    expect(chrome).toContain('function MobileHeader')
    expect(chrome).toContain('useModalDialog<')
    expect(chrome).toContain('aria-haspopup="dialog"')
    expect(chrome).toContain('role="dialog"')
    expect(chrome).toContain('aria-modal="true"')
    expect(chrome).toContain('ref={menuRef}')
  })
})
