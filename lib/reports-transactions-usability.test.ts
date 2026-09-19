import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const reportsView = readFileSync(new URL('../components/money-saathi/reports-view.tsx', import.meta.url), 'utf8')
const monthlySummary = readFileSync(new URL('../components/money-saathi/reports/monthly-summary.tsx', import.meta.url), 'utf8')
const appShell = readFileSync(new URL('../components/money-saathi/app-shell.tsx', import.meta.url), 'utf8')

describe('Reports readability wording', () => {
  it('drops the misleading "Reconciled locally" claim', () => {
    expect(reportsView).not.toContain('Reconciled locally')
  })

  it('uses plain, truthful device wording without bank-reconciliation or AI language', () => {
    expect(reportsView).toContain('Calculated on this device')
    expect(reportsView).toContain('Based on the transactions you recorded in Money Saathi.')
    expect(reportsView).not.toMatch(/reconcil/i)
    expect(reportsView).not.toMatch(/\bAI\b|artificial intelligence/i)
  })

  it('keeps every required report section', () => {
    for (const section of ['MonthlySummary', 'CategoryBreakdown', 'BudgetPerformance', 'Commitments', 'SavingsTrend', 'InsightCards']) {
      expect(reportsView).toContain(section)
    }
  })

  it('does not reintroduce the Essential/Flexible classification', () => {
    expect(reportsView).not.toMatch(/essential/i)
    expect(reportsView).not.toMatch(/flexible/i)
    expect(reportsView).not.toContain('ClassificationBreakdown')
  })

  it('renders each metric as a separated label, value, and context', () => {
    expect(monthlySummary).toContain('summary-metric')
    expect(monthlySummary).toContain('summary-label')
    expect(monthlySummary).toContain('summary-value')
    expect(monthlySummary).toContain('summary-context')
  })
})

describe('Transactions information hierarchy', () => {
  it('leads with a Transactions heading and plain supporting text', () => {
    expect(appShell).toContain('<h1>Transactions</h1>')
    expect(appShell).toContain('Money in and money out, all in one place.')
  })

  it('makes "Add transaction" the primary action', () => {
    expect(appShell).toContain('<button className="primary-button transactions-add" onClick={openAdd}>')
  })

  it('groups the data-management tools into a quieter Data tools disclosure', () => {
    expect(appShell).toContain('<details className="data-tools"><summary>Data tools</summary>')
  })

  it('keeps every data tool available', () => {
    expect(appShell).toContain('Export CSV')
    expect(appShell).toContain('Encrypted backup')
    expect(appShell).toContain('Download unencrypted backup')
    expect(appShell).toContain('onClick={() => backupInput.current?.click()}')
  })

  it('keeps encrypted backup recommended and the unencrypted warning intact', () => {
    expect(appShell).toContain('backup-recommended')
    expect(appShell).toContain('onClick={requestUnencryptedBackup}')
  })

  it('keeps all existing filter controls', () => {
    for (const label of ['Search transactions', 'Type filter', 'Category filter', 'Payment method filter', 'Date period filter', 'Filter from', 'Filter to']) {
      expect(appShell).toContain(`aria-label="${label}"`)
    }
    expect(appShell).toContain("filters.period === 'custom'")
    expect(appShell).toContain('onClick={() => setFilters(emptyFilters)}')
  })
})
