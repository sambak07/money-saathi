/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function source(
  path: string,
): string {
  return readFileSync(
    new URL(
      path,
      import.meta.url,
    ),
    'utf8',
  )
}

const dashboard =
  source('../pages/DashboardPage.tsx')

const assistant =
  source('../components/SaathiFloatingAssistant.tsx')

describe('final live-release audit hardening', () => {
  it('uses neutral Home language when recorded inflow and outflow are both zero or equal', () => {
    expect(dashboard).toContain(
      'No recorded money movement this month.',
    )

    expect(dashboard).toContain(
      'Your recorded inflow and outflow are equal this month.',
    )

    expect(dashboard).toMatch(
      /dashboard\.monthlyIncome === 0[\s\S]*dashboard\.monthlyExpense === 0/,
    )

    expect(dashboard).toContain(
      'dashboard.monthlyNet > 0',
    )

    expect(dashboard).toContain(
      'dashboard.monthlyNet < 0',
    )
  })

  it('restores focus to the floating Saathi launcher after either close path', () => {
    expect(assistant).toContain(
      'const launcherRef =',
    )

    expect(assistant).toContain(
      'const restoreLauncherFocusRef =',
    )

    expect(assistant).toContain(
      'ref={launcherRef}',
    )

    expect(assistant).toContain(
      'launcherRef.current?.focus()',
    )

    expect(
      (
        assistant.match(
          /restoreLauncherFocusRef\.current = true/g,
        ) ?? []
      ).length,
    ).toBeGreaterThanOrEqual(2)
  })
})
