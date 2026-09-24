export type LocalSaathiIntent =
  | 'affordability'
  | 'attention'
  | 'month-change'
  | 'debt'
  | 'saving-guidance'
  | 'spending-control'
  | 'salary-plan'
  | 'learn'
  | 'unknown'

export type LocalLearningTopic =
  | 'emi'
  | 'interest'
  | 'budget'
  | 'safety-buffer'
  | 'fd'
  | 'insurance'
  | 'digital-safety'

export interface LocalSaathiRoute {
  intent: LocalSaathiIntent
  amountNu: string | null
  learningTopic: LocalLearningTopic | null
  confidence: 'high' | 'medium' | 'low'
}

const learningPatterns: Array<{
  topic: LocalLearningTopic
  patterns: RegExp[]
}> = [
  {
    topic: 'emi',
    patterns: [
      /\bemi\b/i,
      /\bmonthly loan payment\b/i,
    ],
  },
  {
    topic: 'interest',
    patterns: [
      /\binterest\b/i,
      /\binterest rate\b/i,
    ],
  },
  {
    topic: 'budget',
    patterns: [
      /\bbudget\b/i,
      /\bspending plan\b/i,
    ],
  },
  {
    topic: 'safety-buffer',
    patterns: [
      /\bsafety buffer\b/i,
      /\bemergency buffer\b/i,
      /\bemergency fund\b/i,
    ],
  },
  {
    topic: 'fd',
    patterns: [
      /\bfd\b/i,
      /\bfixed deposit\b/i,
    ],
  },
  {
    topic: 'insurance',
    patterns: [
      /\binsurance\b/i,
      /\bpremium\b/i,
    ],
  },
  {
    topic: 'digital-safety',
    patterns: [
      /\botp\b/i,
      /\bcvv\b/i,
      /\bpin\b/i,
      /\bscam\b/i,
      /\bfraud\b/i,
      /\bpassword\b/i,
    ],
  },
]

function normalizeQuestion(
  input: string,
): string {
  return input
    .trim()
    .replace(/\s+/g, ' ')
}

function extractAmountNu(
  input: string,
): string | null {
  const normalized =
    input.replace(/,/g, '')

  const matches = [
    normalized.match(
      /(?:nu\.?|ngultrum|btn)\s*([0-9]+(?:\.[0-9]{1,2})?)/i,
    ),
    normalized.match(
      /([0-9]+(?:\.[0-9]{1,2})?)\s*(?:nu\.?|ngultrum|btn)\b/i,
    ),
  ]

  for (
    const match of matches
  ) {
    if (
      match?.[1]
    ) {
      return match[1]
    }
  }

  return null
}

function isLearningQuestion(
  question: string,
): boolean {
  return (
    /\bwhat is\b/i.test(question) ||
    /\bwhat does\b/i.test(question) ||
    /\bexplain\b/i.test(question) ||
    /\bmeaning\b/i.test(question) ||
    /\bteach me\b/i.test(question)
  )
}

export function routeLocalSaathiQuestion(
  input: string,
): LocalSaathiRoute {
  const question =
    normalizeQuestion(
      input,
    )

  if (!question) {
    return {
      intent: 'unknown',
      amountNu: null,
      learningTopic: null,
      confidence: 'low',
    }
  }

  const amountNu =
    extractAmountNu(
      question,
    )

  if (
    amountNu &&
    (
      /\bcan i\b/i.test(question) ||
      /\bcan we\b/i.test(question) ||
      /\bafford\b/i.test(question) ||
      /\bspend\b/i.test(question) ||
      /\bbuy\b/i.test(question) ||
      /\bpurchase\b/i.test(question)
    )
  ) {
    return {
      intent: 'affordability',
      amountNu,
      learningTopic: null,
      confidence: 'high',
    }
  }

  if (
    /\bwhat needs attention\b/i.test(question) ||
    /\bwhat should i check\b/i.test(question) ||
    /\banything wrong\b/i.test(question) ||
    /\banything to worry\b/i.test(question) ||
    /\bwhat should i review\b/i.test(question)
  ) {
    return {
      intent: 'attention',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    }
  }

  if (
    /\bwhat changed\b/i.test(question) ||
    /\bthis month\b.*\blast month\b/i.test(question) ||
    /\bspend(?:ing)? more\b/i.test(question) ||
    /\bexpense(?:s)? increased\b/i.test(question) ||
    /\bmonth comparison\b/i.test(question)
  ) {
    return {
      intent: 'month-change',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    }
  }

  if (
    /\bdebt\b/i.test(question) ||
    /\bloan burden\b/i.test(question) ||
    /\boutstanding loan\b/i.test(question) ||
    /\bhow much.*loan\b/i.test(question) ||
    /\bemi burden\b/i.test(question) ||
    /\breduce.*debt\b/i.test(question) ||
    /\bpay off.*loan\b/i.test(question) ||
    /\brepay.*loan\b/i.test(question)
  ) {
    return {
      intent: 'debt',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    }
  }

  if (
    /\bhow.*sav(?:e|ing)\b/i.test(question) ||
    /\bhelp me save\b/i.test(question) ||
    /\bstart saving\b/i.test(question) ||
    /\bsave more\b/i.test(question) ||
    /\bgood saving\b/i.test(question) ||
    /\bmake.*saving\b/i.test(question) ||
    /\bhow much.*save\b/i.test(question) ||
    /\bi want to save\b/i.test(question)
  ) {
    return {
      intent: 'saving-guidance',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    }
  }

  if (
    /\bcontrol.*spend/i.test(question) ||
    /\breduce.*spend/i.test(question) ||
    /\bspend less\b/i.test(question) ||
    /\bexpenses?.*high\b/i.test(question) ||
    /\bhigh.*expenses?\b/i.test(question) ||
    /\bno money left\b/i.test(question) ||
    /\bmoney.*finish/i.test(question) ||
    /\bcut.*expenses?\b/i.test(question)
  ) {
    return {
      intent: 'spending-control',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    }
  }

  if (
    /\bmanage.*salary\b/i.test(question) ||
    /\bsalary.*manage\b/i.test(question) ||
    /\bplan.*salary\b/i.test(question) ||
    /\bsalary.*plan\b/i.test(question) ||
    /\bsalary.*finish/i.test(question) ||
    /\bsalary.*not enough\b/i.test(question)
  ) {
    return {
      intent: 'salary-plan',
      amountNu: null,
      learningTopic: null,
      confidence: 'high',
    }
  }

  if (
    isLearningQuestion(
      question,
    )
  ) {
    for (
      const item of learningPatterns
    ) {
      if (
        item.patterns.some(
          (pattern) =>
            pattern.test(question),
        )
      ) {
        return {
          intent: 'learn',
          amountNu: null,
          learningTopic:
            item.topic,
          confidence: 'high',
        }
      }
    }
  }

  if (
    /\bspend\b/i.test(question) ||
    /\bbuy\b/i.test(question) ||
    /\bafford\b/i.test(question)
  ) {
    return {
      intent: 'affordability',
      amountNu,
      learningTopic: null,
      confidence: amountNu
        ? 'high'
        : 'medium',
    }
  }

  return {
    intent: 'unknown',
    amountNu: null,
    learningTopic: null,
    confidence: 'low',
  }
}

export const LOCAL_LEARNING_ANSWERS: Record<
  LocalLearningTopic,
  {
    title: string
    answer: string
  }
> = {
  emi: {
    title: 'EMI',
    answer:
      'EMI is a regular loan payment. It usually includes both principal and interest. The EMI amount is not the same thing as the loan balance still outstanding.',
  },
  interest: {
    title: 'Interest',
    answer:
      'Interest is the price of borrowing money or the return paid on some savings. The rate alone is not enough: time, calculation method, fees and repayment pattern can all change the real result.',
  },
  budget: {
    title: 'Budget',
    answer:
      'A budget is a plan for where your money should go. It helps protect essentials and priorities before optional spending. It does not need to be perfect to be useful.',
  },
  'safety-buffer': {
    title: 'Safety buffer',
    answer:
      'A safety buffer is money you deliberately keep outside everyday spending. Its job is to absorb surprises so one unexpected expense does not immediately become new debt.',
  },
  fd: {
    title: 'Fixed deposit',
    answer:
      'A fixed deposit places money for an agreed period under stated interest terms. Early closure can change the interest actually paid, so the premature-closure rules matter.',
  },
  insurance: {
    title: 'Insurance',
    answer:
      'Insurance is protection against specified financial risks. The premium you pay is the cost of that protection and should not automatically be treated as savings or investment value.',
  },
  'digital-safety': {
    title: 'Digital money safety',
    answer:
      'OTP, card PIN, CVV, banking password, seed phrase and recovery code are authentication secrets. Money Saathi does not need them. Urgent requests for these details should be independently verified.',
  },
}