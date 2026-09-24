import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  getSaathiSuggestions,
} from './contextualSuggestions'

describe('Saathi contextual suggestions', () => {
  it('shows transaction-focused prompts on transaction screens', () => {
    const labels =
      getSaathiSuggestions(
        '/app/transactions',
      ).map(
        (item) =>
          item.label,
      )

    expect(labels).toContain(
      'What changed this month?',
    )

    expect(labels).toContain(
      'Why did I spend more?',
    )
  })

  it('shows debt-focused prompts on loan screens', () => {
    const questions =
      getSaathiSuggestions(
        '/app/loans',
      ).map(
        (item) =>
          item.question,
      )

    expect(questions).toContain(
      'How much outstanding loan do I have?',
    )

    expect(questions).toContain(
      'Explain EMI',
    )
  })

  it('keeps Vault suggestions educational rather than reading Vault records', () => {
    const questions =
      getSaathiSuggestions(
        '/app/vault',
      ).map(
        (item) =>
          item.question,
      )

    expect(questions).toContain(
      'Explain digital safety',
    )

    expect(
      questions.some(
        (question) =>
          question.toLowerCase().includes(
            'policy number',
          ),
      ),
    ).toBe(false)
  })
})