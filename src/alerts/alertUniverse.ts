import {
  buildLoanReminderReferences,
  getLoanDueReminders,
} from './loanDueReminders'
import {
  getBusinessOpenItems,
  getBusinessProfiles,
  getFinancialSchemes,
  getFixedDeposits,
  getLoans,
  getRecurringDeposits,
  getRegularMoney,
  getTransactions,
} from '../storage/db'
import {
  getPreferences,
} from '../settings/preferences'
import {
  buildMoneyAlerts,
  countAlertLevels,
  type BusinessDueReference,
  type MoneyAlert,
} from '../utils/moneyAlerts'
import {
  calculateSafeToSpend,
} from '../utils/safeToSpend'
import {
  transactionBalanceChetrum,
} from '../utils/simpleHome'

export interface AlertUniverseData {
  regularMoney: Awaited<
    ReturnType<typeof getRegularMoney>
  >
  transactions: Awaited<
    ReturnType<typeof getTransactions>
  >
  schemes: Awaited<
    ReturnType<typeof getFinancialSchemes>
  >
  loans: Awaited<
    ReturnType<typeof getLoans>
  >
  fixedDeposits: Awaited<
    ReturnType<typeof getFixedDeposits>
  >
  recurringDeposits: Awaited<
    ReturnType<typeof getRecurringDeposits>
  >
  businessDues: BusinessDueReference[]
}

export interface AlertUniverseView {
  alerts: MoneyAlert[]
  visibleAlerts: MoneyAlert[]
  counts: {
    urgent: number
    attention: number
    info: number
  }
}

export async function loadAlertUniverseData():
  Promise<AlertUniverseData> {
  const [
    regularMoney,
    transactions,
    schemes,
    loans,
    fixedDeposits,
    recurringDeposits,
    businessProfiles,
  ] =
    await Promise.all([
      getRegularMoney(),
      getTransactions(),
      getFinancialSchemes(),
      getLoans(),
      getFixedDeposits(),
      getRecurringDeposits(),
      getBusinessProfiles(),
    ])

  const businessDues =
    (
      await Promise.all(
        businessProfiles.map(
          async (business) => {
            const items =
              await getBusinessOpenItems(
                business.id,
              )

            return items
              .filter(
                (item) =>
                  item.dueDate &&
                  item.outstandingAmountChetrum >
                    0,
              )
              .map(
                (
                  item,
                ): BusinessDueReference => ({
                  id:
                    item.id,
                  businessId:
                    business.id,
                  businessName:
                    business.name,
                  direction:
                    item.direction,
                  outstandingAmountChetrum:
                    item.outstandingAmountChetrum,
                  dueDate:
                    item.dueDate,
                }),
              )
          },
        ),
      )
    ).flat()

  return {
    regularMoney,
    transactions,
    schemes,
    loans,
    fixedDeposits,
    recurringDeposits,
    businessDues,
  }
}

export function filterVisibleMoneyAlerts(
  alerts: readonly MoneyAlert[],
  acknowledgedIds: ReadonlySet<string>,
): MoneyAlert[] {
  return alerts.filter(
    (alert) =>
      !acknowledgedIds.has(
        alert.id,
      ),
  )
}

export function buildAlertUniverseView(
  input: {
    today: string
    dueSoonDays: number
    data: AlertUniverseData
    acknowledgedIds: ReadonlySet<string>
  },
): AlertUniverseView {
  const recordedBalanceChetrum =
    transactionBalanceChetrum(
      input.data.transactions,
    )

  const appPreferences =
    getPreferences()

  const safe =
    calculateSafeToSpend(
      input.today,
      recordedBalanceChetrum,
      input.data.regularMoney,
      input.data.transactions,
      appPreferences.safetyBufferChetrum,
    )

  const alerts =
    buildMoneyAlerts({
      today:
        input.today,
      dueSoonDays:
        input.dueSoonDays,
      regularMoney:
        input.data.regularMoney,
      transactions:
        input.data.transactions,
      schemes:
        input.data.schemes,
      recordedBalanceChetrum,
      safeToSpendChetrum:
        safe.safeToSpendChetrum,
      upcomingCommitmentsChetrum:
        safe.upcomingCommitmentsChetrum,
      loanReminders:
        buildLoanReminderReferences(
          input.data.loans,
          getLoanDueReminders(),
        ),
      fixedDeposits:
        input.data.fixedDeposits,
      recurringDeposits:
        input.data.recurringDeposits,
      businessDues:
        input.data.businessDues,
    })

  const visibleAlerts =
    filterVisibleMoneyAlerts(
      alerts,
      input.acknowledgedIds,
    )

  return {
    alerts,
    visibleAlerts,
    counts:
      countAlertLevels(
        visibleAlerts,
      ),
  }
}
