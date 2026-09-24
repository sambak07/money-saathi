import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  routeLocalSaathiQuestion,
} from './localQuestionRouter'

describe('Saathi planning language coverage', () => {
  it('understands monthly planning questions', () => {
    const questions = [
      'How is my month looking?',
      'How does my month look?',
      'Show my monthly plan',
    ]

    for (
      const question of questions
    ) {
      expect(
        routeLocalSaathiQuestion(
          question,
        ).intent,
      ).toBe('month-plan')
    }
  })

  it('understands 30, 60 and 90-day forecast questions', () => {
    const questions = [
      'What does my next 30 days look like?',
      'show my 60-day forecast',
      'cash flow forecast for 90 days',
    ]

    for (
      const question of questions
    ) {
      expect(
        routeLocalSaathiQuestion(
          question,
        ).intent,
      ).toBe(
        'cash-flow-forecast',
      )
    }
  })

  it('understands goal-progress questions', () => {
    const questions = [
      'Am I on track for my goals?',
      'show my goal progress',
      'how much do I need for my goal each month',
    ]

    for (
      const question of questions
    ) {
      expect(
        routeLocalSaathiQuestion(
          question,
        ).intent,
      ).toBe('goal-plan')
    }
  })

  it('keeps explicit month-to-month comparison on the older comparison tool', () => {
    expect(
      routeLocalSaathiQuestion(
        'How is this month compared with last month?',
      ).intent,
    ).toBe('month-change')
  })
})