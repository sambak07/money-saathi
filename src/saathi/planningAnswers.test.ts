import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  answerSaathiPlanningQuestion,
  forecastHorizonFromQuestion,
} from './planningAnswers'

const emptySource = {
  today: '2026-09-24',
  safetyBufferChetrum: 0,
  transactions: [],
  regularMoney: [],
  savingsAccounts: [],
  loans: [],
  goals: [],
  goalContributions: [],
}

describe('Saathi deterministic planning answers', () => {
  it('reads explicit forecast horizons and defaults broader forecast questions to 90 days', () => {
    expect(
      forecastHorizonFromQuestion(
        'next 30 days',
      ),
    ).toBe(30)

    expect(
      forecastHorizonFromQuestion(
        'show 60 day forecast',
      ),
    ).toBe(60)

    expect(
      forecastHorizonFromQuestion(
        'what is my forecast',
      ),
    ).toBe(90)
  })

  it('answers a month question without inventing money', () => {
    const answer =
      answerSaathiPlanningQuestion(
        'month-plan',
        'How is my month looking?',
        emptySource,
      )

    expect(answer).toContain(
      'Current Safe to Spend is Nu. 0.00.',
    )

    expect(answer).toContain(
      'Scheduled future income is shown for planning but is not counted as current cash.',
    )
  })

  it('answers an empty forecast as a planning scenario', () => {
    const answer =
      answerSaathiPlanningQuestion(
        'cash-flow-forecast',
        'next 30 days',
        emptySource,
      )

    expect(answer).toContain(
      'Over the next 30 days',
    )

    expect(answer).toContain(
      'This is a planning scenario, not guaranteed future cash.',
    )
  })

  it('does not invent a goal when none is recorded', () => {
    const answer =
      answerSaathiPlanningQuestion(
        'goal-plan',
        'Am I on track for my goals?',
        emptySource,
      )

    expect(answer).toContain(
      'You do not have a recorded goal yet.',
    )

    expect(answer).toContain(
      'Saathi will not invent a target or saving amount for you.',
    )
  })
})