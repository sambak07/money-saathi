import type {
  MoneySaathiDatabaseSnapshot,
} from '../storage/db'

export const PERSONAL_PORTABLE_EXPORT_FORMAT =
  'MoneySaathiPersonalExport'

export const PERSONAL_PORTABLE_EXPORT_VERSION =
  1

export function buildPersonalPortableJson(
  snapshot: MoneySaathiDatabaseSnapshot,
  exportedOn: string,
): string {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      exportedOn,
    )
  ) {
    throw new Error(
      'Personal export date must use YYYY-MM-DD.',
    )
  }

  return JSON.stringify(
    {
      format:
        PERSONAL_PORTABLE_EXPORT_FORMAT,
      version:
        PERSONAL_PORTABLE_EXPORT_VERSION,
      exportedOn,
      amountUnit:
        'chetrum',
      personal: {
        transactions:
          snapshot.transactions,
        budgets:
          snapshot.budgets,
        regularMoney:
          snapshot.regularMoney,
        goals:
          snapshot.goals,
        goalContributions:
          snapshot.goalContributions,
        savingsAccounts:
          snapshot.savingsAccounts,
        fixedDeposits:
          snapshot.fixedDeposits,
        recurringDeposits:
          snapshot.recurringDeposits,
        loans:
          snapshot.loans,
        financialSchemes:
          snapshot.financialSchemes,
      },
    },
    null,
    2,
  )
}

export function safePersonalJsonFileName(
  dateText: string,
): string {
  const safeDate =
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateText,
    )
      ? dateText
      : 'export'

  return `money-saathi-personal-${safeDate}.json`
}