import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { resolveModalKey, resolveTabTarget } from './modal-focus'

describe('resolveTabTarget (focus trap boundaries)', () => {
  it('wraps forward from the last element to the first', () => {
    expect(resolveTabTarget(3, 2, false)).toBe(0)
  })

  it('wraps backward from the first element to the last', () => {
    expect(resolveTabTarget(3, 0, true)).toBe(2)
  })

  it('lets the browser move focus naturally in the middle of the list', () => {
    expect(resolveTabTarget(3, 1, false)).toBeNull()
    expect(resolveTabTarget(3, 1, true)).toBeNull()
  })

  it('does not wrap forward until actually on the last element', () => {
    expect(resolveTabTarget(3, 0, false)).toBeNull()
  })

  it('pulls escaped focus back inside (first on Tab, last on Shift+Tab)', () => {
    expect(resolveTabTarget(3, -1, false)).toBe(0)
    expect(resolveTabTarget(3, -1, true)).toBe(2)
  })

  it('returns null when there are no focusable elements', () => {
    expect(resolveTabTarget(0, -1, false)).toBeNull()
  })

  it('treats a single focusable element as its own wrap point', () => {
    expect(resolveTabTarget(1, 0, false)).toBe(0)
    expect(resolveTabTarget(1, 0, true)).toBe(0)
  })
})

describe('resolveModalKey (keyboard behaviour)', () => {
  const base = { closable: true, focusableCount: 4, activeIndex: 1 }

  it('closes on Escape when the dialog is closable', () => {
    expect(resolveModalKey('Escape', false, base)).toEqual({ type: 'close' })
  })

  it('ignores Escape while the dialog is locked (e.g. saving)', () => {
    expect(resolveModalKey('Escape', false, { ...base, closable: false })).toEqual({ type: 'none' })
  })

  it('traps Tab focus at the end of the list', () => {
    expect(resolveModalKey('Tab', false, { ...base, activeIndex: 3 })).toEqual({ type: 'focus', index: 0 })
  })

  it('traps Shift+Tab focus at the start of the list', () => {
    expect(resolveModalKey('Tab', true, { ...base, activeIndex: 0 })).toEqual({ type: 'focus', index: 3 })
  })

  it('leaves mid-list Tab to the browser', () => {
    expect(resolveModalKey('Tab', false, { ...base, activeIndex: 2 })).toEqual({ type: 'none' })
  })

  it('pulls back focus that escaped the dialog on Tab', () => {
    expect(resolveModalKey('Tab', false, { ...base, activeIndex: -1 })).toEqual({ type: 'focus', index: 0 })
  })

  it('ignores unrelated keys', () => {
    expect(resolveModalKey('Enter', false, base)).toEqual({ type: 'none' })
    expect(resolveModalKey('a', false, base)).toEqual({ type: 'none' })
  })
})

describe('transaction entry modal wiring (no regression to a raw overlay)', () => {
  const appShell = readFileSync(new URL('../components/money-saathi/app-shell.tsx', import.meta.url), 'utf8')
  const appDialog = readFileSync(new URL('../components/money-saathi/dialogs/app-dialog.tsx', import.meta.url), 'utf8')
  const hook = readFileSync(new URL('../components/money-saathi/dialogs/use-modal-dialog.ts', import.meta.url), 'utf8')

  it('exposes the Add/Edit transaction form as a real modal dialog', () => {
    const form = appShell.match(/\{showForm && <div className="modal-backdrop"[\s\S]*?<\/form><\/div>\}/)?.[0] || ''
    expect(form).toContain('role="dialog"')
    expect(form).toContain('aria-modal="true"')
    expect(form).toContain('aria-labelledby={transactionTitleId}')
    expect(form).toContain('ref={transactionDialogRef}')
    // The accessible name comes from the visible heading.
    expect(form).toContain('<h2 id={transactionTitleId}>')
    // The close control keeps an accessible name.
    expect(form).toContain('aria-label="Close"')
  })

  it('shares the one focus-management primitive instead of duplicating it', () => {
    expect(appShell).toContain("import { useModalDialog } from '@/components/money-saathi/dialogs/use-modal-dialog'")
    expect(appShell).toContain('const transactionDialogRef = useModalDialog<HTMLFormElement>({ open: showForm, onClose: closeTransactionForm, closable: !transactionSaving })')
    // AppDialog must route through the same hook, not its own hand-rolled effect.
    expect(appDialog).toContain("import { useModalDialog } from './use-modal-dialog'")
    expect(appDialog).toContain('useModalDialog<HTMLDivElement>({ open, onClose, initialFocus: destructive ? \'secondary\' : \'first\' })')
    expect(appDialog).not.toContain('addEventListener')
    // The primitive owns focus trapping, Escape, scroll lock, and focus restore.
    expect(hook).toContain("document.body.style.overflow = 'hidden'")
    expect(hook).toContain("document.addEventListener('keydown', onKeyDown)")
    expect(hook).toContain('previous?.focus()')
    expect(hook).toContain('resolveModalKey')
  })

  it('guards closing the transaction form while a save is running', () => {
    expect(appShell).toContain('const closeTransactionForm = () => { if (!transactionSavingRef.current) setShowForm(false) }')
    const form = appShell.match(/\{showForm && <div className="modal-backdrop"[\s\S]*?<\/form><\/div>\}/)?.[0] || ''
    expect(form).toContain('onMouseDown={event => { if (event.target === event.currentTarget) closeTransactionForm() }}')
    expect(form).toContain('onClick={closeTransactionForm}')
    expect(form).toContain('disabled={transactionSaving}')
  })

  it('preserves Edit vs Add distinction and both submit labels', () => {
    const form = appShell.match(/\{showForm && <div className="modal-backdrop"[\s\S]*?<\/form><\/div>\}/)?.[0] || ''
    expect(form).toContain("{editing ? 'Edit transaction' : 'Add a transaction'}")
    expect(form).toContain("{editing ? 'Save changes' : 'Save transaction'}")
    expect(form).toContain('onSubmit={saveTransaction}')
  })
})
