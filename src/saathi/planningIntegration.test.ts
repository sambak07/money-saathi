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

const floating =
  source('../components/SaathiFloatingAssistant.tsx')

const fullPage =
  source('../pages/AskSaathiPage.tsx')

const suggestions =
  source('./contextualSuggestions.ts')

const answers =
  source('./planningAnswers.ts')

const questionDataAccess =
  source('./questionDataAccess.ts')

describe('Saathi planning integration', () => {
  it('connects both Saathi surfaces to the same deterministic planning answer engine', () => {
    expect(floating).toContain(
      'answerSaathiPlanningQuestion(',
    )

    expect(fullPage).toContain(
      'answerSaathiPlanningQuestion(',
    )
  })

  it('loads goal data locally through the permission-gated data access layer', () => {
    expect(questionDataAccess).toContain(
      'getGoals()',
    )

    expect(questionDataAccess).toContain(
      'getGoalContributions()',
    )

    expect(questionDataAccess).toContain(
      "sanitized.categories[\n      'goals'",
    )

    expect(floating).toContain(
      'loadPermittedSaathiQuestionData(',
    )

    expect(fullPage).toContain(
      'loadPermittedSaathiQuestionData(',
    )
  })

  it('suggests planning questions on the new planning routes', () => {
    expect(suggestions).toContain(
      "'/app/month'",
    )

    expect(suggestions).toContain(
      "'/app/forecast'",
    )

    expect(suggestions).toContain(
      "'/app/debt-goals'",
    )
  })

  it('remains local-only and does not add network AI', () => {
    expect(answers).not.toContain(
      'fetch(',
    )

    expect(floating).not.toContain(
      'openai',
    )

    expect(fullPage).not.toContain(
      'openai',
    )

    expect(floating).not.toContain(
      'getVault',
    )

    expect(fullPage).not.toContain(
      'getVault',
    )
  })
})