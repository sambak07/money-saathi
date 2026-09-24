import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  routeLocalSaathiQuestion,
} from './localQuestionRouter'

describe('Saathi ordinary-language coverage', () => {
  it('understands common saving phrases', () => {
    const questions = [
      'how to make good saving',
      'how can I save more',
      'help me save',
      'I want to start saving',
      'how much should I save',
    ]

    for (
      const question of questions
    ) {
      expect(
        routeLocalSaathiQuestion(
          question,
        ).intent,
      ).toBe(
        'saving-guidance',
      )
    }
  })

  it('understands common spending-control phrases', () => {
    const questions = [
      'how to control spending',
      'my expenses are high',
      'how can I spend less',
      'I have no money left',
      'how to cut expenses',
    ]

    for (
      const question of questions
    ) {
      expect(
        routeLocalSaathiQuestion(
          question,
        ).intent,
      ).toBe(
        'spending-control',
      )
    }
  })

  it('understands salary-management phrases', () => {
    const questions = [
      'how to manage salary',
      'help me plan my salary',
      'my salary finishes too fast',
      'salary is not enough',
    ]

    for (
      const question of questions
    ) {
      expect(
        routeLocalSaathiQuestion(
          question,
        ).intent,
      ).toBe(
        'salary-plan',
      )
    }
  })

  it('keeps debt-reduction questions inside the deterministic debt tool', () => {
    expect(
      routeLocalSaathiQuestion(
        'how can I reduce debt',
      ).intent,
    ).toBe('debt')

    expect(
      routeLocalSaathiQuestion(
        'how to pay off my loan',
      ).intent,
    ).toBe('debt')
  })
})