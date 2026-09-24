/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'

import {
  describe,
  expect,
  it,
} from 'vitest'

function readSource(relativePath: string): string {
  return readFileSync(
    new URL(relativePath, import.meta.url),
    'utf8',
  )
}

const indexHtml = readSource('../../index.html')
const shellSource = readSource('../components/AppShell.tsx')
const accessibilityCss = readSource('../styles/accessibility.css')
const dialogHookSource =
  readSource('./useAccessibleDialog.ts')

const dialogPageSources = [
  readSource('../pages/TransactionsPage.tsx'),
  readSource('../pages/BudgetPage.tsx'),
  readSource('../pages/RegularMoneyPage.tsx'),
  readSource('../pages/GoalsPage.tsx'),
  readSource('../pages/MyMoneyPage.tsx'),
  readSource('../pages/LoansPage.tsx'),
  readSource('../pages/SchemesPage.tsx'),
]

describe('accessibility and mobile foundations', () => {
  it('keeps the viewport meta tag', () => {
    expect(indexHtml).toMatch(
      /<meta\s+name=["']viewport["']/i,
    )
  })

  it('provides a keyboard skip link and focusable main target', () => {
    expect(shellSource).toContain('href="#main-content"')
    expect(shellSource).toContain('id="main-content"')
    expect(shellSource).toContain('tabIndex={-1}')
  })

  it('labels the desktop navigation', () => {
    expect(shellSource).toContain(
      'aria-label="Money Saathi navigation"',
    )
  })

  it('labels the mobile navigation', () => {
    expect(shellSource).toContain(
      'aria-label="Mobile navigation"',
    )
  })

  it('supports reduced motion users', () => {
    expect(accessibilityCss).toContain(
      '@media (prefers-reduced-motion: reduce)',
    )
  })

  it('prevents small mobile form text from triggering page zoom', () => {
    expect(accessibilityCss).toMatch(
      /@media\s*\(max-width:\s*520px\)[\s\S]*font-size:\s*16px/,
    )
  })

  it('keeps visible keyboard focus treatment', () => {
    expect(accessibilityCss).toContain(':focus-visible')
    expect(accessibilityCss).toContain('outline:')
  })

  it('gives custom dialogs keyboard focus lifecycle management', () => {
    expect(dialogHookSource).toContain(
      "event.key === 'Escape'",
    )
    expect(dialogHookSource).toContain(
      "event.key !== 'Tab'",
    )
    expect(dialogHookSource).toContain(
      'previousFocus?.focus()',
    )
  })

  it('gives custom dialogs accessible names and focus refs', () => {
    for (const source of dialogPageSources) {
      expect(source).toContain(
        'useAccessibleDialog',
      )
      expect(source).toContain(
        'aria-labelledby=',
      )
      expect(source).toContain(
        'tabIndex={-1}',
      )
    }
  })
})
