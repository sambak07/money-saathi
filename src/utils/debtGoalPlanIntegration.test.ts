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

const app =
  source('../App.tsx')

const page =
  source('../pages/DebtGoalPlanPage.tsx')

const more =
  source('../pages/MorePage.tsx')

const engine =
  source('./debtGoalPlan.ts')

describe('debt and goal planning integration', () => {
  it('registers and exposes the planning route', () => {
    expect(app).toContain(
      "const DebtGoalPlanPage = lazy(() => import('./pages/DebtGoalPlanPage'))",
    )

    expect(app).toContain(
      'path="/app/debt-goals"',
    )

    expect(more).toContain(
      "to: '/app/debt-goals'",
    )
  })

  it('states the debt decision boundary', () => {
    expect(page).toContain(
      'Money Saathi shows the numbers without deciding',
    )

    expect(page).toContain(
      'not a recommendation to repay this loan first.',
    )

    expect(page).toContain(
      'This page does not move your money.',
    )
  })

  it('states the goal calculation boundary', () => {
    expect(page).toContain(
      'Simple average needed per calendar month',
    )

    expect(page).toContain(
      'It assumes no investment return.',
    )

    expect(page).toContain(
      'does not',
    )

    expect(page).toContain(
      'subtract the whole EMI from principal.',
    )
  })

  it('uses local recorded loans, savings and goal data only', () => {
    expect(page).toContain(
      'getLoans()',
    )

    expect(page).toContain(
      'getSavingsAccounts()',
    )

    expect(page).toContain(
      'getGoals()',
    )

    expect(page).toContain(
      'getGoalContributions()',
    )

    expect(page).not.toContain(
      'fetch(',
    )

    expect(engine).not.toContain(
      'fetch(',
    )
  })
})