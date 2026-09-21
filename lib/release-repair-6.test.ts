import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DB_VERSION, DB_STORE_NAMES } from './db'
import { SCHEMA_VERSION } from './finance'
import { budgetMonthSummary } from './budget-view-model'
import { formatMonthLabel } from './reporting'
import { createTransaction } from './transactions'
import { currentBalance, monthlyIncome, monthlyExpenses, monthlySavings } from './analytics'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const appShell = read('../components/money-saathi/app-shell.tsx')
const appLock = read('../components/money-saathi/app-lock-settings.tsx')
const audit = read('../components/audit-panel.tsx')
const myMoney = read('../components/money-saathi/my-money-view.tsx')
const goals = read('../components/money-saathi/goals-view.tsx')
const budget = read('../components/money-saathi/budget-view.tsx')
const monthlySummary = read('../components/money-saathi/reports/monthly-summary.tsx')
const savingsTrend = read('../components/money-saathi/reports/savings-trend.tsx')
const insightCards = read('../components/money-saathi/reports/insight-cards.tsx')
const reportsView = read('../components/money-saathi/reports-view.tsx')
const globalsCss = read('../app/globals.css')

describe('R-01 Settings layout and hierarchy', () => {
  it('1. Settings block has exactly one page-level H1 (Settings)', () => {
    const block = appShell.match(/active === 'Settings' && <SettingsView>[\s\S]*?<\/SettingsView>/)?.[0] || ''
    expect(block).not.toBe('')
    expect((block.match(/<h1>/g) || []).length).toBe(1)
    expect(block).toContain('<h1>Settings</h1>')
    expect(block).toContain('Manage your profile, privacy and local app preferences.')
  })

  it('2. profile name and Main use use separate layout structures', () => {
    const block = appShell.match(/settings-subsection profile-settings[\s\S]*?<\/section>/)?.[0] || ''
    expect((block.match(/className="profile-field"/g) || []).length).toBe(2)
    expect(block).toContain('className="profile-name-row"')
    expect(block).toContain('htmlFor="settings-name"')
    expect(block).toContain('htmlFor="settings-main-use"')
    // dedicated CSS keeps the name row and Main use from colliding
    expect(globalsCss).toContain('.profile-name-row {')
    expect(globalsCss).toContain('.profile-field {')
  })

  it('3. Activity history heading is subordinate (H2, 18px, not a giant heading)', () => {
    expect(audit).toContain('<h2>Activity history</h2>')
    expect(globalsCss).toMatch(/\.audit-panel h2 \{[^}]*font-size: 18px/)
  })
})

describe('R-02 Activity history human copy', () => {
  it('4. raw eventType/action/source are not displayed in normal activity rows', () => {
    expect(audit).not.toContain('{event.eventType} · {event.action} · {event.source}')
    // underlying audit data is kept, only demoted to a secondary title attribute
    expect(audit).toContain('title={`${event.eventType} · ${event.action} · ${event.source}`}')
    expect(audit).toContain('<strong>{event.summary}</strong>')
  })

  it('4b. row shows a human-readable date/time', () => {
    expect(audit).toContain('const formatWhen')
    expect(audit).toContain("month: 'short'")
    expect(audit).toContain('{formatWhen(event.occurredAt)}')
  })
})

describe('R-03 transaction validation inside the dialog', () => {
  it('5. amount error renders inside the transaction dialog', () => {
    const form = appShell.match(/ref=\{transactionDialogRef\}[\s\S]*?<\/form>/)?.[0] || ''
    expect(form).toContain('Amount in Ngultrum')
    expect(form).toContain('role="alert"')
    expect(form).toContain('id={amountErrorId}')
    expect(form).toContain('{transactionError && <p className="form-error"')
  })

  it('6. invalid amount wires aria-invalid and aria-describedby on the Amount input', () => {
    const form = appShell.match(/ref=\{transactionDialogRef\}[\s\S]*?<\/form>/)?.[0] || ''
    expect(form).toContain("aria-invalid={transactionError ? 'true' : undefined}")
    expect(form).toContain('aria-describedby={transactionError ? amountErrorId : undefined}')
    expect(form).toContain('ref={amountInputRef}')
    // focus the Amount input after a failed submit
    expect(appShell).toContain('amountInputRef.current?.focus()')
  })

  it('7. transactionError is not rendered in the global page notice', () => {
    const notice = appShell.match(/&& <div className="notice" aria-live="polite">\{[^}]*\}<\/div>/)?.[0] || ''
    expect(notice).not.toContain('transactionError')
    expect(notice).toContain('storageError || backupError || actionNotice')
  })

  it('8. transaction error clears as soon as the amount is corrected', () => {
    expect(appShell).toContain("if (key === 'amount') setTransactionError('')")
  })
})

describe('R-04 clear stale action feedback', () => {
  it('9. backup/restore feedback clears on navigation, on new attempt, and on success', () => {
    // navigation clears the transient notice (guarded render-time reset)
    expect(appShell).toContain("if (activeRef.current !== active) { activeRef.current = active; if (actionNotice) setActionNotice('') }")
    // a new restore attempt clears it first
    expect(appShell).toContain("async function restore(file: File) { setActionNotice('');")
    // both restore errors now use the transient notice, not the persistent storage error
    expect(appShell).toContain("setActionNotice('Could not read this backup. Nothing was replaced, so your existing records were not changed.')")
    expect(appShell).toContain("setActionNotice('Could not restore this backup. The replacement runs as one all-or-nothing step, so your existing records were not changed.')")
    // successful restore clears it
    expect(appShell).toContain("setPendingRestore(null); setActionNotice(''); startLoad();")
    // genuine storage-startup errors are still on their own persistent state
    expect(appShell).toContain('Money Saathi could not open private storage')
  })
})

describe('R-05 budget summary language', () => {
  it('10. aggregate remaining reads "Left across all budgets"', () => {
    expect(budget).toContain("summary.overBudget ? 'Over across all budgets' : 'Left across all budgets'")
    expect(budget).not.toContain("? 'Over budget' : 'Money left'")
  })

  it('11. the count of over-budget categories is shown', () => {
    expect(budget).toContain('const overCount = rows.filter(row => row.overspent).length')
    expect(budget).toContain("'1 category over budget'")
    expect(budget).toContain('categories over budget')
  })

  it('11b. budget arithmetic is unchanged', () => {
    expect(budgetMonthSummary(10000, 4000)).toEqual({ budgeted: 10000, spent: 4000, moneyLeft: 6000, overBudget: false, overAmount: 0 })
    expect(budgetMonthSummary(10000, 13000)).toEqual({ budgeted: 10000, spent: 13000, moneyLeft: 0, overBudget: true, overAmount: 3000 })
  })
})

describe('R-06 reports terminology (display only)', () => {
  it('12. monthly summary says "Left after spending"', () => {
    expect(monthlySummary).toContain('Left after spending')
    expect(monthlySummary).not.toContain('>Savings<')
  })

  it('13. monthly summary says "Share of income left"', () => {
    expect(monthlySummary).toContain('Share of income left')
  })

  it('14. no user-facing "Savings rate" remains', () => {
    expect(monthlySummary).not.toContain('Savings rate')
  })

  it('15. trend uses "Left" rather than "Savings"', () => {
    expect(savingsTrend).toContain('Left after spending trend')
    expect(savingsTrend).toContain('Left {formatCurrency(row.savings)}')
    expect(savingsTrend).not.toContain('Savings trend')
    expect(savingsTrend).not.toContain('Savings {formatCurrency')
  })

  it('16b. reports empty state talks about money left, not deliberate saving', () => {
    expect(reportsView).toContain('income, spending and money left')
    expect(reportsView).not.toContain('income and spending, savings,')
  })
})

describe('R-07 reports human language', () => {
  it('16. report month labels are human-readable', () => {
    expect(formatMonthLabel('2026-09')).toBe('Sep 2026')
    expect(formatMonthLabel('2026-01')).toBe('Jan 2026')
    expect(formatMonthLabel('bad')).toBe('bad')
    expect(savingsTrend).toContain('{formatMonthLabel(row.month)}')
  })

  it('17. "Deterministic observations" is removed', () => {
    expect(insightCards).not.toContain('Deterministic observations')
    expect(insightCards).toContain('Your month at a glance')
  })
})

describe('R-08 form readability', () => {
  it('18. add-sheet labels and controls meet the updated CSS sizes', () => {
    expect(globalsCss).toMatch(/\.add-sheet label \{[^}]*font-size: 14px/)
    expect(globalsCss).toMatch(/\.add-sheet input, \.add-sheet select, \.date-input \{[^}]*height: 44px[^}]*font-size: 15px/)
  })
})

describe('R-09 page heading hierarchy', () => {
  it('19. My Money has only one H1', () => {
    expect((myMoney.match(/<h1>/g) || []).length).toBe(1)
    expect(myMoney).toContain('<h1>My Money</h1>')
  })

  it('20. Goals has only one H1', () => {
    expect((goals.match(/<h1>/g) || []).length).toBe(1)
    expect(goals).toContain('<h1>Goals</h1>')
  })

  it('21. generic PageHeader is not rendered for My Money or Goals', () => {
    expect(appShell).toContain("active !== 'My Money' && active !== 'Goals' && active !== 'Settings' && <PageHeader")
  })
})

describe('R-10 accessible edit names', () => {
  it('22. budget Edit action has a contextual aria-label', () => {
    expect(budget).toContain('aria-label={`Edit ${label} budget`}')
  })

  it('23. regular-item Edit action has a contextual aria-label', () => {
    expect(budget).toContain('aria-label={`Edit ${item.name} regular payment`}')
  })
})

describe('R-11 My Money copy', () => {
  it('24. RD placeholder is RD-specific and FD keeps its own', () => {
    expect(myMoney).toContain("type === 'recurring-deposit' ? 'Monthly recurring deposit' : '3-year Fixed Deposit'")
    expect(myMoney).toContain("type === 'savings-account' ? 'Druk PNB Savings'")
  })

  it('25. My Money helper says "transaction balance"', () => {
    expect(myMoney).toContain('This will not change your transaction balance.')
    expect(myMoney).not.toContain('This does not create a transaction or change your balance.')
  })
})

describe('financial model untouched', () => {
  it('26. DB_VERSION remains 5', () => {
    expect(DB_VERSION).toBe(5)
  })

  it('27. DB stores are unchanged', () => {
    expect(DB_STORE_NAMES).toEqual(['transactions', 'categories', 'budgets', 'recurring', 'settings', 'audit', 'lock', 'reminders', 'reminderDismissals', 'goals', 'financialAssets'])
  })

  it('28. backup SCHEMA_VERSION remains 1', () => {
    expect(SCHEMA_VERSION).toBe(1)
  })

  it('29. canonical financial calculations are unchanged', () => {
    const month = new Date().toISOString().slice(0, 7)
    const income = createTransaction({ type: 'income', amountChetrum: 500000, categoryId: 'salary', date: `${month}-05`, paymentMethod: 'Bank transfer', note: '', isRecurring: false })
    const expense = createTransaction({ type: 'expense', amountChetrum: 120000, categoryId: 'food', date: `${month}-06`, paymentMethod: 'Cash', note: '', isRecurring: false })
    const txns = [income, expense]
    expect(monthlyIncome(txns, month)).toBe(500000)
    expect(monthlyExpenses(txns, month)).toBe(120000)
    expect(monthlySavings(txns, month)).toBe(380000)
    expect(currentBalance(100000, txns)).toBe(100000 + 500000 - 120000)
  })

  it('R-02 reserved: no transfer/loan/adjustment types were introduced', () => {
    for (const banned of ['Transfer', 'Loan proceeds', 'Owner contribution', 'Adjustment']) {
      expect(appShell).not.toContain(`>${banned}<`)
    }
  })
})

describe('preserved behaviour', () => {
  it('App Lock heading bumped to H2 without losing its single Lock control', () => {
    expect(appLock).toContain('<h2>App Lock</h2>')
    expect((appLock.match(/Lock app now/g) || []).length).toBe(1)
  })
})
