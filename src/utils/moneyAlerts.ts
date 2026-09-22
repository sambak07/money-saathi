import type {
  FinancialScheme,
} from '../types/scheme'
import type {
  RegularMoney,
} from '../types/regularMoney'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  generateOccurrencesBetween,
} from './recurrence'

export type MoneyAlertLevel =
  | 'urgent'
  | 'attention'
  | 'info'

export type MoneyAlertStatus =
  | 'overdue'
  | 'today'
  | 'soon'
  | 'status'

export type MoneyAlertSource =
  | 'regular-money'
  | 'scheme'
  | 'safe-to-spend'

export interface MoneyAlert {
  id: string
  level: MoneyAlertLevel
  status: MoneyAlertStatus
  source: MoneyAlertSource
  title: string
  detail: string
  dueDate: string | null
  amountChetrum: number | null
  href: string
  actionLabel: string
  notificationEligible: boolean
}

export interface BuildMoneyAlertsInput {
  today: string
  dueSoonDays: number
  regularMoney: RegularMoney[]
  transactions: MoneyTransaction[]
  schemes: FinancialScheme[]
  recordedBalanceChetrum: number
  safeToSpendChetrum: number
  upcomingCommitmentsChetrum: number
}

const DAY_MS =
  24 * 60 * 60 * 1000

function parseIsoDate(
  value: string,
): Date {
  const [
    year,
    month,
    day,
  ] = value.split('-').map(Number)

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
    ),
  )
}

function addDaysIso(
  value: string,
  days: number,
): string {
  const date =
    parseIsoDate(value)

  date.setUTCDate(
    date.getUTCDate() + days,
  )

  return date
    .toISOString()
    .slice(0, 10)
}

function daysFromToday(
  today: string,
  date: string,
): number {
  return Math.round(
    (
      parseIsoDate(date).getTime() -
      parseIsoDate(today).getTime()
    ) /
      DAY_MS,
  )
}

function recordedOccurrenceKeys(
  transactions: MoneyTransaction[],
): Set<string> {
  const keys =
    new Set<string>()

  for (const transaction of transactions) {
    if (
      transaction.recurringSourceId &&
      transaction.scheduledFor
    ) {
      keys.add(
        `${transaction.recurringSourceId}|${transaction.scheduledFor}`,
      )
    }
  }

  return keys
}

function describeDue(
  days: number,
): string {
  if (days < 0) {
    const overdueDays =
      Math.abs(days)

    return overdueDays === 1
      ? '1 day past the scheduled date'
      : `${overdueDays} days past the scheduled date`
  }

  if (days === 0) {
    return 'Scheduled for today'
  }

  if (days === 1) {
    return 'Scheduled for tomorrow'
  }

  return `Scheduled in ${days} days`
}

function regularAlert(
  schedule: RegularMoney,
  date: string,
  today: string,
): MoneyAlert {
  const days =
    daysFromToday(
      today,
      date,
    )

  const isExpense =
    schedule.kind === 'expense'

  const status: MoneyAlertStatus =
    days < 0
      ? 'overdue'
      : days === 0
        ? 'today'
        : 'soon'

  const level: MoneyAlertLevel =
    isExpense &&
    days <= 0
      ? 'urgent'
      : days <= 0
        ? 'attention'
        : isExpense
          ? 'attention'
          : 'info'

  const kindLabel =
    isExpense
      ? 'expense'
      : 'income'

  return {
    id:
      `regular:${schedule.id}:${date}`,
    level,
    status,
    source: 'regular-money',
    title:
      days < 0
        ? `${schedule.name} ${kindLabel} date has passed`
        : days === 0
          ? `${schedule.name} ${kindLabel} is scheduled today`
          : `${schedule.name} ${kindLabel} is coming up`,
    detail:
      `${describeDue(days)}. This reminder is based on Regular Money and disappears when the matching recurring occurrence is recorded.`,
    dueDate: date,
    amountChetrum:
      schedule.amountChetrum,
    href: '/app/regular-money',
    actionLabel:
      'Review Regular Money',
    notificationEligible: true,
  }
}

function schemeAlert(
  scheme: FinancialScheme,
  today: string,
): MoneyAlert {
  const date =
    scheme.nextContributionDate

  const days =
    daysFromToday(
      today,
      date,
    )

  const status: MoneyAlertStatus =
    days < 0
      ? 'overdue'
      : days === 0
        ? 'today'
        : 'soon'

  return {
    id:
      `scheme:${scheme.id}:${date}`,
    level:
      days <= 0
        ? 'attention'
        : 'info',
    status,
    source: 'scheme',
    title:
      days < 0
        ? `${scheme.name} contribution date has passed`
        : days === 0
          ? `${scheme.name} contribution date is today`
          : `${scheme.name} contribution date is coming up`,
    detail:
      `${describeDue(days)}. Scheme dates are references only; Money Saathi cannot know whether a contribution was actually paid unless you update the record.`,
    dueDate: date,
    amountChetrum:
      scheme.contributionChetrum,
    href: '/app/my-money/schemes',
    actionLabel: 'Review scheme',
    notificationEligible: true,
  }
}

function alertRank(
  alert: MoneyAlert,
): number {
  const levelRank =
    alert.level === 'urgent'
      ? 0
      : alert.level === 'attention'
        ? 1
        : 2

  const statusRank =
    alert.status === 'overdue'
      ? 0
      : alert.status === 'today'
        ? 1
        : alert.status === 'soon'
          ? 2
          : 3

  return (
    levelRank * 10 +
    statusRank
  )
}

export function buildMoneyAlerts(
  input: BuildMoneyAlertsInput,
): MoneyAlert[] {
  if (
    !Number.isSafeInteger(
      input.dueSoonDays,
    ) ||
    input.dueSoonDays < 1 ||
    input.dueSoonDays > 31
  ) {
    throw new Error(
      'Due-soon window must be between 1 and 31 days.',
    )
  }

  const recordedKeys =
    recordedOccurrenceKeys(
      input.transactions,
    )

  const rangeStart =
    addDaysIso(
      input.today,
      -30,
    )

  const rangeEnd =
    addDaysIso(
      input.today,
      input.dueSoonDays,
    )

  const alerts:
    MoneyAlert[] = []

  for (const schedule of input.regularMoney) {
    const dates =
      generateOccurrencesBetween(
        schedule,
        rangeStart,
        rangeEnd,
      )

    for (const date of dates) {
      if (
        recordedKeys.has(
          `${schedule.id}|${date}`,
        )
      ) {
        continue
      }

      alerts.push(
        regularAlert(
          schedule,
          date,
          input.today,
        ),
      )
    }
  }

  for (const scheme of input.schemes) {
    if (
      scheme.status !== 'active' ||
      !scheme.nextContributionDate ||
      scheme.contributionChetrum <= 0
    ) {
      continue
    }

    if (
      scheme.nextContributionDate <
        rangeStart ||
      scheme.nextContributionDate >
        rangeEnd
    ) {
      continue
    }

    alerts.push(
      schemeAlert(
        scheme,
        input.today,
      ),
    )
  }

  if (
    input.safeToSpendChetrum === 0 &&
    (
      input.recordedBalanceChetrum > 0 ||
      input.upcomingCommitmentsChetrum > 0
    )
  ) {
    alerts.push({
      id: 'status:safe-to-spend-zero',
      level: 'attention',
      status: 'status',
      source: 'safe-to-spend',
      title:
        'Safe to Spend is currently Nu. 0',
      detail:
        'Based on your recorded balance, upcoming commitments and safety buffer, Money Saathi is not showing spendable room right now.',
      dueDate: null,
      amountChetrum: null,
      href: '/app/safety-buffer',
      actionLabel:
        'Review Safe to Spend',
      notificationEligible: false,
    })
  }

  return alerts.sort(
    (a, b) => {
      const rank =
        alertRank(a) -
        alertRank(b)

      if (rank !== 0) {
        return rank
      }

      if (
        a.dueDate &&
        b.dueDate
      ) {
        return a.dueDate.localeCompare(
          b.dueDate,
        )
      }

      return a.title.localeCompare(
        b.title,
      )
    },
  )
}

export function countAlertLevels(
  alerts: MoneyAlert[],
): {
  urgent: number
  attention: number
  info: number
} {
  return {
    urgent:
      alerts.filter(
        (alert) =>
          alert.level === 'urgent',
      ).length,
    attention:
      alerts.filter(
        (alert) =>
          alert.level === 'attention',
      ).length,
    info:
      alerts.filter(
        (alert) =>
          alert.level === 'info',
      ).length,
  }
}
