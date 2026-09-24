export interface SaathiSuggestion {
  label: string
  question: string
}

const DEFAULT_SUGGESTIONS: SaathiSuggestion[] = [
  {
    label: 'Can I spend Nu. 5,000?',
    question: 'Can I spend Nu. 5,000?',
  },
  {
    label: 'What needs attention?',
    question: 'What needs attention?',
  },
  {
    label: 'Explain EMI',
    question: 'Explain EMI',
  },
]

export function getSaathiSuggestions(
  pathname: string,
): SaathiSuggestion[] {
  if (
    pathname.startsWith(
      '/app/transactions',
    )
  ) {
    return [
      {
        label: 'What changed this month?',
        question: 'What changed this month?',
      },
      {
        label: 'Why did I spend more?',
        question: 'Why did I spend more this month?',
      },
      {
        label: 'What needs attention?',
        question: 'What needs attention?',
      },
    ]
  }

  if (
    pathname.startsWith(
      '/app/loans',
    ) ||
    pathname.startsWith(
      '/app/loan-reminders',
    )
  ) {
    return [
      {
        label: 'How much debt do I have?',
        question: 'How much outstanding loan do I have?',
      },
      {
        label: 'What is my EMI burden?',
        question: 'What is my EMI burden?',
      },
      {
        label: 'Explain EMI',
        question: 'Explain EMI',
      },
    ]
  }

  if (
    pathname.startsWith(
      '/app/budget',
    )
  ) {
    return [
      {
        label: 'What needs attention?',
        question: 'What needs attention?',
      },
      {
        label: 'Explain budget',
        question: 'Explain budget',
      },
      {
        label: 'What is a safety buffer?',
        question: 'What is a safety buffer?',
      },
    ]
  }

  if (
    pathname.startsWith(
      '/app/goals',
    )
  ) {
    return [
      {
        label: 'What needs attention?',
        question: 'What needs attention?',
      },
      {
        label: 'Explain safety buffer',
        question: 'Explain safety buffer',
      },
      {
        label: 'Can I spend Nu. 5,000?',
        question: 'Can I spend Nu. 5,000?',
      },
    ]
  }

  if (
    pathname.startsWith(
      '/app/vault',
    )
  ) {
    return [
      {
        label: 'Explain digital safety',
        question: 'Explain digital safety',
      },
      {
        label: 'What is a scam warning sign?',
        question: 'Explain scam safety',
      },
      {
        label: 'Explain insurance',
        question: 'Explain insurance',
      },
    ]
  }

  if (
    pathname.startsWith(
      '/app/my-money',
    ) ||
    pathname.startsWith(
      '/app/savings',
    ) ||
    pathname.startsWith(
      '/app/fixed-deposits',
    ) ||
    pathname.startsWith(
      '/app/recurring-deposits',
    )
  ) {
    return [
      {
        label: 'What needs attention?',
        question: 'What needs attention?',
      },
      {
        label: 'Explain fixed deposit',
        question: 'Explain fixed deposit',
      },
      {
        label: 'How much debt do I have?',
        question: 'How much outstanding loan do I have?',
      },
    ]
  }

  return DEFAULT_SUGGESTIONS.map(
    (item) => ({
      ...item,
    }),
  )
}