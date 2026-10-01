import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  LOCAL_LEARNING_ANSWERS,
  routeLocalSaathiQuestion,
} from './localQuestionRouter'

describe('local Ask Saathi question router', () => {
  it('routes a Nu. spending question with the amount', () => {
    expect(
      routeLocalSaathiQuestion(
        'Can I spend Nu. 5,000 before salary?',
      ),
    ).toEqual({
      intent: 'affordability',
      amountNu: '5000',
      learningTopic: null,
      confidence: 'high',
    })
  })

  it('routes attention and month-change questions locally', () => {
    expect(
      routeLocalSaathiQuestion(
        'What needs attention?',
      ).intent,
    ).toBe('attention')

    expect(
      routeLocalSaathiQuestion(
        'Why did I spend more this month?',
      ).intent,
    ).toBe('month-change')
  })

  it('routes recorded monthly spending questions to the month view', () => {
    expect(
      routeLocalSaathiQuestion(
        'How much did I spend this month?',
      ),
    ).toEqual({
      intent: 'month-plan',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    })

    expect(
      routeLocalSaathiQuestion(
        'How much have I spent this month?',
      ).intent,
    ).toBe('month-plan')

    expect(
      routeLocalSaathiQuestion(
        'What did I spend this month?',
      ).intent,
    ).toBe('month-plan')
  })

  it('keeps explicit future spending questions as affordability', () => {
    expect(
      routeLocalSaathiQuestion(
        'Can I spend Nu. 500 this month?',
      ),
    ).toEqual({
      intent: 'affordability',
      amountNu: '500',
      learningTopic: null,
      confidence: 'high',
    })
  })

  it('routes debt questions without guessing an amount', () => {
    expect(
      routeLocalSaathiQuestion(
        'How much outstanding loan do I have?',
      ),
    ).toEqual({
      intent: 'debt',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    })
  })

  it('answers supported learning topics locally', () => {
    const routed =
      routeLocalSaathiQuestion(
        'Explain EMI',
      )

    expect(
      routed.intent,
    ).toBe('learn')

    expect(
      routed.learningTopic,
    ).toBe('emi')

    expect(
      LOCAL_LEARNING_ANSWERS.emi.answer,
    ).toContain(
      'regular loan payment',
    )
  })

  it('returns unknown instead of pretending to understand unsupported questions', () => {
    expect(
      routeLocalSaathiQuestion(
        'Tell me whether the stock market will rise tomorrow',
      ).intent,
    ).toBe('unknown')
  })
})