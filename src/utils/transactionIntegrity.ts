import type {
  MoneyTransaction,
} from '../types/transaction'

export type RecurringTransactionMetadata = Pick<
  MoneyTransaction,
  'recurringSourceId' | 'scheduledFor'
>

export function preserveRecurringMetadata(
  existing: MoneyTransaction | null,
): RecurringTransactionMetadata {
  if (
    !existing?.recurringSourceId ||
    !existing.scheduledFor
  ) {
    return {}
  }

  return {
    recurringSourceId:
      existing.recurringSourceId,
    scheduledFor:
      existing.scheduledFor,
  }
}

export function isFutureTransactionDate(
  date: string,
  today: string,
): boolean {
  return date > today
}