import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { safeToChetrum } from './currency'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const onboarding = read('../components/money-saathi/onboarding.tsx')
const publicHome = read('../components/money-saathi/public-home.tsx')
const appShell = read('../components/money-saathi/app-shell.tsx')
const appLock = read('../components/money-saathi/app-lock-settings.tsx')
const myMoney = read('../components/money-saathi/my-money-view.tsx')
const budget = read('../components/money-saathi/budget-view.tsx')
const goals = read('../components/money-saathi/goals-view.tsx')
const navigation = read('../components/money-saathi/navigation.tsx')
const chrome = read('../components/money-saathi/app-chrome.tsx')

describe('1. onboarding opening-balance validation', () => {
  it('rejects the exact invalid inputs that used to slip through to step 4', () => {
    expect(safeToChetrum('abc').value).toBeUndefined()
    expect(safeToChetrum('1.234').value).toBeUndefined()
    expect(safeToChetrum('-100').value).toBeUndefined()
  })

  it('accepts valid Ngultrum amounts including two decimals and zero', () => {
    expect(safeToChetrum('100').value).toBe(10000)
    expect(safeToChetrum('100.50').value).toBe(10050)
    expect(safeToChetrum('0').value).toBe(0)
  })

  it('guards the step 3 -> step 4 transition with the safe parser before advancing', () => {
    expect(onboarding).toContain('function continueFromBalance()')
    const guard = onboarding.match(/function continueFromBalance\(\) \{[\s\S]*?\n {2}\}/)?.[0] || ''
    expect(guard).toContain('safeToChetrum(trimmed)')
    expect(guard).toContain('parsed.value === undefined || parsed.value < 0')
    // Advancing only happens after the parser accepts the amount.
    expect(guard).toContain("setBalanceError(''); setStep(4)")
    expect(guard).toContain('return')
  })

  it('announces the balance error and skip still means Nu. 0', () => {
    expect(onboarding).toContain('role="alert"')
    expect(onboarding).toContain('id="onboarding-balance-error"')
    expect(onboarding).toContain("function skipBalance() { setAmount(''); setBalanceError(''); setStep(4) }")
  })
})

describe('2. public section links resolve to the homepage from every route', () => {
  it('uses root-anchored fragments so /sign-in and /get-started reach homepage sections', () => {
    for (const fragment of ['/#features', '/#how-it-works', '/#privacy', '/#about']) {
      expect(publicHome).toContain(`href="${fragment}"`)
    }
  })

  it('no longer uses bare same-page fragments that only work on the homepage', () => {
    expect(publicHome).not.toContain('href="#features"')
    expect(publicHome).not.toContain('href="#how-it-works"')
    expect(publicHome).not.toContain('href="#privacy"')
    expect(publicHome).not.toContain('href="#about"')
  })
})

describe('3. sign-in is not advertised as a working feature', () => {
  it('removes every public link/CTA pointing at /sign-in', () => {
    expect(publicHome).not.toContain('href="/sign-in"')
  })

  it('stops telling Get Started visitors they already have an account', () => {
    expect(publicHome).not.toContain('Already have an account')
    expect(publicHome).toContain('Account sign-in is coming in a later release')
  })

  it('keeps future sign-in privacy copy clearly future-facing', () => {
    expect(publicHome).toContain('When account sign-in arrives in a later release')
  })
})

describe('5. Settings cleanup and single Lock control', () => {
  it('removes the duplicate outer "Lock app now" from the shell', () => {
    expect((appShell.match(/Lock app now/g) || []).length).toBe(0)
  })

  it('keeps exactly one "Lock app now" inside App Lock settings', () => {
    expect((appLock.match(/Lock app now/g) || []).length).toBe(1)
  })

  it('does not render a global Add-transaction PageHeader over Settings', () => {
    expect(appShell).toContain("active !== 'Settings' && <PageHeader")
  })

  it('groups settings and isolates the destructive erase control', () => {
    expect(appShell).toContain('settings-subsection profile-settings')
    expect(appShell).toContain('<p className="eyebrow">Reminders</p>')
    expect(appShell).toContain('className="panel settings-danger"')
    expect(appShell).toContain('danger-eyebrow')
    // The two-step erase confirmation is preserved (opens a dialog, not an immediate wipe).
    expect(appShell).toContain('onClick={() => void resetData()}')
  })
})

describe('6. restore feedback reflects the atomic replacement', () => {
  it('drops the uncertain "not intentionally changed" wording', () => {
    expect(appShell).not.toContain('not intentionally changed')
  })

  it('states plainly that existing records were not changed on failure', () => {
    expect(appShell).toContain('Nothing was replaced, so your existing records were not changed.')
    expect(appShell).toContain('all-or-nothing step, so your existing records were not changed.')
  })

  it('keeps audit-log failure separate from restore success (audit errors never fail the restore)', () => {
    // addAudit swallows its own error and surfaces a distinct message, so a post-commit
    // audit write cannot trigger the restore-failed branch.
    expect(appShell).toContain('The action completed, but its audit record could not be saved.')
  })
})

describe('7. Home uses plain, truthful terminology', () => {
  it('no longer uses the technical "Tracked assets" / "Add your first asset" wording', () => {
    expect(appShell).not.toContain('Tracked assets')
    expect(appShell).not.toContain('Add your first asset')
  })

  it('uses savings/deposit language and an honest income-minus-expenses label', () => {
    expect(appShell).toContain('Savings &amp; deposits')
    expect(appShell).toContain('Add savings or deposit')
    expect(appShell).toContain('label="Left after spending"')
    expect(appShell).toContain('note="Income minus expenses this month"')
  })

  it('does not call the Home number a savings rate', () => {
    const stat = appShell.match(/label="Left after spending"[^/]*\/>/)?.[0] || ''
    expect(stat).not.toContain('savings rate')
  })
})

describe('8. My Money shows the recurring-deposit institution', () => {
  it('appends the institution to the RD subtitle when one is stored', () => {
    expect(myMoney).toContain('asset.institution ? `${formatCurrency(asset.monthlyContributionChetrum)} / month · ${asset.institution}`')
  })
})

describe('9. recurring Kind is only for payments', () => {
  it('shows Essential/Flexible only when the regular item is an expense', () => {
    expect(budget).toContain("{recurringType === 'expense' && <label>Kind<select")
  })

  it('still persists a valid classification on the recurring record', () => {
    // classification remains part of the saved RecurringItem regardless of type.
    expect(budget).toContain('classification,')
  })
})

describe('10. every interactive overlay uses the shared modal primitive', () => {
  const modalFiles: Array<[string, string, string[]]> = [
    ['navigation (More sheet)', navigation, ['ref={moreRef}']],
    ['sidebar (Privacy details)', chrome, ['ref={privacyRef}']],
    ['my money (choose + form)', myMoney, ['ref={chooseRef}', 'ref={formRef}']],
    ['budget (regular item)', budget, ['ref={recurringRef}']],
    ['goals (create + edit)', goals, ['ref={createRef}', 'ref={editRef}']],
  ]

  for (const [name, source, refs] of modalFiles) {
    it(`${name} routes through useModalDialog with role/aria wiring`, () => {
      expect(source).toContain('useModalDialog<')
      expect(source).toContain('role="dialog"')
      expect(source).toContain('aria-modal="true"')
      for (const ref of refs) expect(source).toContain(ref)
    })
  }

  it('goals dialogs gained the accessibility attributes they previously lacked', () => {
    expect(goals).toContain('aria-label="Create goal"')
    expect(goals).toContain('role="presentation"')
  })
})
