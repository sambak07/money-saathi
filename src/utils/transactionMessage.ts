import {
  parseNuToChetrum,
} from './money'
import type {
  TransactionKind,
} from '../types/transaction'

export type MessageDirection =
  | TransactionKind
  | 'unknown'

export interface ParsedTransactionMessage {
  amountChetrum: number | null
  date: string | null
  direction: MessageDirection
}

interface AmountCandidate {
  amountChetrum: number
  index: number
}

const incomeWords =
  /\b(?:credited|credit(?:ed)?\s+to|received|deposited|refunded|refund\s+received|payment\s+received)\b/i

const expenseWords =
  /\b(?:debited|debit(?:ed)?\s+from|paid|sent|withdrawn|spent|purchased|purchase\s+of|payment\s+made)\b/i

const balanceLabelBeforeAmount =
  /(?:total\s+aval\.?\s*bal|available\s+balance|available\s+bal|aval\.?\s*bal|avl\.?\s*bal|a\/?c\s*bal(?:ance)?|ac\s*bal(?:ance)?|acc\s*bal(?:ance)?|closing\s+bal(?:ance)?|balance|bal)\s*(?:is\s*)?[:=-]?\s*(?:nu\.?|btn\.?|ngultrum)?\s*$/i

function normalizeYear(
  year: number,
): number {
  return year < 100
    ? 2000 + year
    : year
}

function toIsoDate(
  year: number,
  month: number,
  day: number,
): string | null {
  const normalizedYear =
    normalizeYear(year)

  const date =
    new Date(
      Date.UTC(
        normalizedYear,
        month - 1,
        day,
      ),
    )

  if (
    date.getUTCFullYear() !== normalizedYear ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return [
    String(normalizedYear).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-')
}

function parseDate(
  message: string,
): string | null {
  const iso =
    message.match(
      /\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/,
    )

  if (iso) {
    return toIsoDate(
      Number(iso[1]),
      Number(iso[2]),
      Number(iso[3]),
    )
  }

  const dayFirst =
    message.match(
      /\b(\d{1,2})[./-](\d{1,2})[./-](20\d{2}|\d{2})\b/,
    )

  if (dayFirst) {
    return toIsoDate(
      Number(dayFirst[3]),
      Number(dayFirst[2]),
      Number(dayFirst[1]),
    )
  }

  const monthLookup: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  }

  const named =
    message.match(
      /\b(\d{1,2})[\s-]+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[\s,-]+(20\d{2}|\d{2})\b/i,
    )

  if (!named) {
    return null
  }

  const month =
    monthLookup[
      named[2].toLowerCase()
    ]

  if (!month) {
    return null
  }

  return toIsoDate(
    Number(named[3]),
    month,
    Number(named[1]),
  )
}

function getDirection(
  message: string,
): MessageDirection {
  const income =
    incomeWords.test(message)

  const expense =
    expenseWords.test(message)

  if (income === expense) {
    return 'unknown'
  }

  return income
    ? 'income'
    : 'expense'
}

function getDirectionIndex(
  message: string,
): number | null {
  const income =
    message.search(incomeWords)

  const expense =
    message.search(expenseWords)

  const indexes =
    [income, expense].filter(
      (index) => index >= 0,
    )

  return indexes.length > 0
    ? Math.min(...indexes)
    : null
}

function isBalanceCandidate(
  message: string,
  amountIndex: number,
): boolean {
  const prefix =
    message.slice(
      Math.max(
        0,
        amountIndex - 52,
      ),
      amountIndex,
    )

  return balanceLabelBeforeAmount.test(
    prefix,
  )
}

function collectAmountCandidates(
  message: string,
): AmountCandidate[] {
  const expressions = [
    /(?:^|[\s(])(?:nu\.?|btn\.?|ngultrum)\s*[:=]?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/gi,
    /(?:^|[\s(])([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:nu\.?|btn\.?|ngultrum)\b/gi,
  ]

  const candidates: AmountCandidate[] = []

  for (const expression of expressions) {
    let match: RegExpExecArray | null

    while (
      (
        match =
          expression.exec(message)
      ) !== null
    ) {
      const rawAmount =
        match[1]

      const amountChetrum =
        parseNuToChetrum(
          rawAmount,
        )

      if (amountChetrum === null) {
        continue
      }

      const amountOffset =
        match[0].indexOf(
          rawAmount,
        )

      const index =
        match.index +
        Math.max(
          0,
          amountOffset,
        )

      candidates.push({
        amountChetrum,
        index,
      })
    }
  }

  const unique =
    new Map<string, AmountCandidate>()

  for (const candidate of candidates) {
    unique.set(
      String(candidate.index) +
        '|' +
        String(candidate.amountChetrum),
      candidate,
    )
  }

  return [
    ...unique.values(),
  ]
}

function getAmount(
  message: string,
): number | null {
  const transactionCandidates =
    collectAmountCandidates(
      message,
    ).filter(
      (candidate) =>
        !isBalanceCandidate(
          message,
          candidate.index,
        ),
    )

  if (
    transactionCandidates.length ===
    0
  ) {
    return null
  }

  if (
    transactionCandidates.length ===
    1
  ) {
    return transactionCandidates[0]
      .amountChetrum
  }

  const directionIndex =
    getDirectionIndex(
      message,
    )

  if (directionIndex === null) {
    return null
  }

  const ranked =
    [...transactionCandidates].sort(
      (left, right) =>
        Math.abs(
          left.index -
            directionIndex,
        ) -
        Math.abs(
          right.index -
            directionIndex,
        ),
    )

  const firstDistance =
    Math.abs(
      ranked[0].index -
        directionIndex,
    )

  const secondDistance =
    Math.abs(
      ranked[1].index -
        directionIndex,
    )

  if (
    firstDistance ===
    secondDistance
  ) {
    return null
  }

  return ranked[0].amountChetrum
}

export function parseTransactionMessage(
  rawMessage: string,
): ParsedTransactionMessage {
  const message =
    rawMessage
      .replace(/\s+/g, ' ')
      .trim()

  if (!message) {
    return {
      amountChetrum: null,
      date: null,
      direction: 'unknown',
    }
  }

  return {
    amountChetrum:
      getAmount(message),
    date:
      parseDate(message),
    direction:
      getDirection(message),
  }
}
