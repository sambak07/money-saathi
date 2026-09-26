import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
  useSearchParams,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  getBusinessInventoryItems,
  getBusinessOpenItems,
  getBusinessProfiles,
  getBusinessTradeEntries,
  getBusinessTradeLines,
  getBusinessTransactions,
} from '../storage/db'
import type {
  BusinessInventoryItem,
  BusinessOpenItem,
  BusinessProfile,
  BusinessTradeEntry,
  BusinessTradeLine,
  BusinessTransaction,
} from '../types/business'
import {
  buildBusinessReport,
} from '../utils/businessReport'
import {
  buildBusinessMonthlyReportCsv,
  getBusinessMonthlyReportCsvFilename,
} from '../utils/businessReportExport'
import {
  getBusinessMonthRange,
} from '../utils/businessReportPeriod'
import {
  formatNu,
  getLocalToday,
} from '../utils/money'

import '../styles/business-reports.css'

function monthLabel(
  monthValue: string,
): string {
  const [
    year,
    month,
  ] =
    monthValue.split('-')

  return new Intl.DateTimeFormat(
    undefined,
    {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  ).format(
    new Date(
      Date.UTC(
        Number(
          year,
        ),
        Number(
          month,
        ) -
          1,
        1,
      ),
    ),
  )
}

function BusinessReportsPage() {
  const [searchParams] =
    useSearchParams()

  const requestedBusinessId =
    searchParams.get(
      'businessId',
    ) ?? ''

  const today =
    getLocalToday()

  const currentMonth =
    today.slice(
      0,
      7,
    )

  const [month, setMonth] =
    useState(
      currentMonth,
    )

  const [businesses, setBusinesses] =
    useState<BusinessProfile[]>([])

  const [
    selectedBusinessId,
    setSelectedBusinessId,
  ] =
    useState('')

  const [
    transactions,
    setTransactions,
  ] =
    useState<BusinessTransaction[]>([])

  const [
    tradeEntries,
    setTradeEntries,
  ] =
    useState<BusinessTradeEntry[]>([])

  const [
    tradeLines,
    setTradeLines,
  ] =
    useState<BusinessTradeLine[]>([])

  const [
    openItems,
    setOpenItems,
  ] =
    useState<BusinessOpenItem[]>([])

  const [
    inventoryItems,
    setInventoryItems,
  ] =
    useState<BusinessInventoryItem[]>([])

  const [error, setError] =
    useState('')

  const selectedBusiness =
    businesses.find(
      (business) =>
        business.id ===
        selectedBusinessId,
    ) ?? null

  const period =
    useMemo(
      () => {
        try {
          return getBusinessMonthRange(
            month,
            today,
          )
        } catch {
          return null
        }
      },
      [
        month,
        today,
      ],
    )

  const report =
    useMemo(
      () => {
        if (
          !selectedBusinessId ||
          !period
        ) {
          return null
        }

        try {
          return buildBusinessReport({
            startDate:
              period.startDate,
            endDate:
              period.endDate,
            today,
            transactions,
            tradeEntries,
            tradeLines,
            openItems,
            inventoryItems,
          })
        } catch {
          return null
        }
      },
      [
        selectedBusinessId,
        period,
        today,
        transactions,
        tradeEntries,
        tradeLines,
        openItems,
        inventoryItems,
      ],
    )

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const records =
          await getBusinessProfiles()

        if (!active) {
          return
        }

        setBusinesses(
          records,
        )

        const initialBusiness =
          records.find(
            (business) =>
              business.id ===
              requestedBusinessId,
          ) ??
          records[0] ??
          null

        setSelectedBusinessId(
          initialBusiness?.id ??
            '',
        )
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load your business.',
          )
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [
    requestedBusinessId,
  ])

  useEffect(() => {
    let active = true

    if (
      !selectedBusinessId
    ) {
      return () => {
        active = false
      }
    }

    async function load() {
      try {
        const [
          nextTransactions,
          nextTradeEntries,
          nextTradeLines,
          nextOpenItems,
          nextInventoryItems,
        ] =
          await Promise.all([
            getBusinessTransactions(
              selectedBusinessId,
            ),
            getBusinessTradeEntries(
              selectedBusinessId,
            ),
            getBusinessTradeLines(
              selectedBusinessId,
            ),
            getBusinessOpenItems(
              selectedBusinessId,
            ),
            getBusinessInventoryItems(
              selectedBusinessId,
            ),
          ])

        if (!active) {
          return
        }

        setTransactions(
          nextTransactions,
        )

        setTradeEntries(
          nextTradeEntries,
        )

        setTradeLines(
          nextTradeLines,
        )

        setOpenItems(
          nextOpenItems,
        )

        setInventoryItems(
          nextInventoryItems,
        )
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load this business report.',
          )
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [
    selectedBusinessId,
  ])

  function downloadBusinessReportCsv() {
    if (
      !report ||
      !period ||
      !selectedBusiness
    ) {
      return
    }

    const csv =
      buildBusinessMonthlyReportCsv({
        businessName:
          selectedBusiness.name,
        month,
        periodStart:
          period.startDate,
        periodEnd:
          period.endDate,
        today,
        report,
      })

    const blob =
      new Blob(
        [
          '\uFEFF',
          csv,
        ],
        {
          type:
            'text/csv;charset=utf-8',
        },
      )

    const url =
      URL.createObjectURL(
        blob,
      )

    const anchor =
      document.createElement(
        'a',
      )

    anchor.href =
      url

    anchor.download =
      getBusinessMonthlyReportCsvFilename(
        selectedBusiness.name,
        month,
      )

    document.body.appendChild(
      anchor,
    )

    anchor.click()
    anchor.remove()

    window.setTimeout(
      () =>
        URL.revokeObjectURL(
          url,
        ),
      0,
    )
  }

  function printBusinessReport() {
    window.print()
  }

  return (
    <AppShell>
      <div className="dashboard-container business-reports-page">
        <header className="business-reports-header">
          <div>
            <p className="dashboard-eyebrow">
              Business
            </p>

            <h1>
              Reports
            </h1>

            <p>
              A simple monthly view of the records you entered.
            </p>
          </div>

          <Link to="/app/business">
            Business Home
          </Link>
        </header>

        {error && (
          <div
            className="business-reports-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {businesses.length ===
        0 ? (
          <section className="business-reports-empty">
            <strong>
              No business yet.
            </strong>

            <p>
              Create a business workspace before using reports.
            </p>

            <Link to="/app/business/cash">
              Create business
            </Link>
          </section>
        ) : (
          <>
            <section className="business-reports-controls">
              {businesses.length >
                1 && (
                <label>
                  Business
                  <select
                    value={
                      selectedBusinessId
                    }
                    onChange={
                      (event) => {
                        setSelectedBusinessId(
                          event.target.value,
                        )
                        setError('')
                      }
                    }
                  >
                    {businesses.map(
                      (business) => (
                        <option
                          key={
                            business.id
                          }
                          value={
                            business.id
                          }
                        >
                          {business.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              )}

              <label>
                Month
                <input
                  type="month"
                  max={
                    currentMonth
                  }
                  value={
                    month
                  }
                  onChange={
                    (event) =>
                      setMonth(
                        event.target.value,
                      )
                  }
                />
              </label>

              <div
                className="business-reports-export-actions"
                aria-label="Business report downloads"
              >
                <button
                  type="button"
                  onClick={
                    printBusinessReport
                  }
                >
                  Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={
                    downloadBusinessReportCsv
                  }
                >
                  Download CSV
                </button>
              </div>
            </section>

            {report && period ? (
              <>
                <section className="business-reports-title">
                  <div>
                    <span>
                      {selectedBusiness?.name ??
                        'Business'}
                    </span>

                    <h2>
                      {monthLabel(
                        month,
                      )}
                    </h2>
                  </div>

                  <small>
                    Period: {period.startDate} to {period.endDate}
                  </small>
                </section>

                <section
                  className="business-monthly-report-card"
                  aria-label="Business monthly report card"
                >
                  <header className="business-monthly-report-card-header">
                    <div>
                      <span>
                        Money Saathi · Business
                      </span>

                      <h2>
                        Monthly Business Report
                      </h2>

                      <p>
                        {selectedBusiness?.name ??
                          'Business'} ·{' '}
                        {monthLabel(
                          month,
                        )}
                      </p>
                    </div>

                    <small>
                      Period: {period.startDate} to {period.endDate}
                    </small>
                  </header>

                  <section className="business-monthly-report-card-grid">
                    <article>
                      <span>
                        Sales
                      </span>

                      <strong>
                        {formatNu(
                          report.registeredSalesChetrum,
                        )}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Purchases
                      </span>

                      <strong>
                        {formatNu(
                          report.registeredPurchasesChetrum,
                        )}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Cash in
                      </span>

                      <strong>
                        {formatNu(
                          report.recordedCashInChetrum,
                        )}
                      </strong>
                    </article>

                    <article>
                      <span>
                        Cash out
                      </span>

                      <strong>
                        {formatNu(
                          report.recordedCashOutChetrum,
                        )}
                      </strong>
                    </article>
                  </section>

                  <section className="business-monthly-report-card-margin">
                    <div>
                      <span>
                        Verified gross margin before other expenses
                      </span>

                      <strong>
                        {formatNu(
                          report.verifiedGrossMarginBeforeOtherBusinessExpensesChetrum,
                        )}
                      </strong>
                    </div>

                    <p>
                      {report.grossMarginCoverageComplete
                        ? 'Margin coverage is complete for recorded sales in this period.'
                        : `Based only on verified sales. ${report.unverifiedSaleDocumentCount} ${
                            report.unverifiedSaleDocumentCount ===
                            1
                              ? 'sale needs'
                              : 'sales need'
                          } item-line or COGS review.`}
                    </p>

                    <strong className="business-monthly-report-card-warning">
                      This is not net profit.
                    </strong>
                  </section>

                  <section className="business-monthly-report-card-current">
                    <div>
                      <p className="dashboard-eyebrow">
                        Current position
                      </p>

                      <strong>
                        As of {today}
                      </strong>

                      <small>
                        These are current balances, not historical month-end balances.
                      </small>
                    </div>

                    <dl>
                      <div>
                        <dt>
                          To collect
                        </dt>

                        <dd>
                          {formatNu(
                            report.currentReceivablesChetrum,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          To pay
                        </dt>

                        <dd>
                          {formatNu(
                            report.currentPayablesChetrum,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Estimated stock value
                        </dt>

                        <dd>
                          {formatNu(
                            report.estimatedStockValueChetrum,
                          )}
                        </dd>
                      </div>
                    </dl>
                  </section>

                  <section className="business-monthly-report-card-attention">
                    <strong>
                      Attention
                    </strong>

                    <div>
                      <span>
                        Overdue to collect:{' '}
                        {formatNu(
                          report.overdueReceivablesChetrum,
                        )}
                      </span>

                      <span>
                        Overdue to pay:{' '}
                        {formatNu(
                          report.overduePayablesChetrum,
                        )}
                      </span>

                      <span>
                        Low-stock items:{' '}
                        {report.lowStockItemCount}
                      </span>

                      <span>
                        Negative-stock items:{' '}
                        {report.negativeStockItemCount}
                      </span>
                    </div>
                  </section>

                  <footer className="business-monthly-report-card-footer">
                    <span>
                      Sales, cash, current dues and stock remain separate.
                    </span>

                    <span>
                      This is not an audited financial statement, tax return, GST/BST filing or full accounting ledger.
                    </span>
                  </footer>
                </section>

                <section className="business-reports-grid">
                  <article>
                    <span>
                      Sales
                    </span>

                    <strong>
                      {formatNu(
                        report.registeredSalesChetrum,
                      )}
                    </strong>

                    <small>
                      Recorded sale documents in this month.
                    </small>
                  </article>

                  <article>
                    <span>
                      Purchases
                    </span>

                    <strong>
                      {formatNu(
                        report.registeredPurchasesChetrum,
                      )}
                    </strong>

                    <small>
                      Recorded purchase documents in this month.
                    </small>
                  </article>

                  <article>
                    <span>
                      Cash in
                    </span>

                    <strong>
                      {formatNu(
                        report.recordedCashInChetrum,
                      )}
                    </strong>

                    <small>
                      Recorded business money received in this month.
                    </small>
                  </article>

                  <article>
                    <span>
                      Cash out
                    </span>

                    <strong>
                      {formatNu(
                        report.recordedCashOutChetrum,
                      )}
                    </strong>

                    <small>
                      Recorded business money paid in this month.
                    </small>
                  </article>
                </section>

                <section className="business-reports-margin">
                  <div>
                    <span>
                      Gross margin before other expenses
                    </span>

                    <strong>
                      {formatNu(
                        report.verifiedGrossMarginBeforeOtherBusinessExpensesChetrum,
                      )}
                    </strong>

                    <small>
                      Verified sale-line amounts minus explicit COGS.
                    </small>
                  </div>

                  <p>
                    {report.grossMarginCoverageComplete
                      ? 'Margin coverage is complete for recorded sales in this period.'
                      : `Margin is based only on verified sales. ${report.unverifiedSaleDocumentCount} ${
                          report.unverifiedSaleDocumentCount ===
                          1
                            ? 'sale needs'
                            : 'sales need'
                        } item-line or COGS review.`}
                  </p>

                  <strong className="business-reports-not-profit">
                    This is not net profit.
                  </strong>
                </section>

                <section className="business-reports-current">
                  <div className="business-reports-section-heading">
                    <div>
                      <p className="dashboard-eyebrow">
                        Current position
                      </p>

                      <h2>
                        Today
                      </h2>
                    </div>

                    <span>
                      These figures are current, not historical month-end balances.
                    </span>
                  </div>

                  <div className="business-reports-current-grid">
                    <article>
                      <span>
                        To collect
                      </span>

                      <strong>
                        {formatNu(
                          report.currentReceivablesChetrum,
                        )}
                      </strong>

                      <small>
                        Current outstanding customer dues.
                      </small>
                    </article>

                    <article>
                      <span>
                        To pay
                      </span>

                      <strong>
                        {formatNu(
                          report.currentPayablesChetrum,
                        )}
                      </strong>

                      <small>
                        Current outstanding supplier dues.
                      </small>
                    </article>

                    <article>
                      <span>
                        Estimated stock value
                      </span>

                      <strong>
                        {formatNu(
                          report.estimatedStockValueChetrum,
                        )}
                      </strong>

                      <small>
                        Current quantity × recorded current unit cost.
                      </small>
                    </article>
                  </div>
                </section>

                <section className="business-reports-attention">
                  <strong>
                    Attention
                  </strong>

                  <div>
                    <span>
                      Overdue to collect:{' '}
                      {formatNu(
                        report.overdueReceivablesChetrum,
                      )}
                    </span>

                    <span>
                      Overdue to pay:{' '}
                      {formatNu(
                        report.overduePayablesChetrum,
                      )}
                    </span>

                    <span>
                      Low-stock items:{' '}
                      {report.lowStockItemCount}
                    </span>

                    <span>
                      Negative-stock items:{' '}
                      {report.negativeStockItemCount}
                    </span>
                  </div>
                </section>

                <section className="business-reports-boundary">
                  <strong>
                    What this report is — and is not
                  </strong>

                  <span>
                    It summarizes Money Saathi records. Sales, cash,
                    current dues and stock remain separate. It is not an
                    audited financial statement, tax return, GST/BST filing
                    or full accounting ledger.
                  </span>
                </section>
              </>
            ) : (
              <section className="business-reports-empty">
                <strong>
                  This report needs review.
                </strong>

                <p>
                  Money Saathi could not safely combine the selected records.
                  Review sales, stock and dues instead of relying on a guessed
                  result.
                </p>

                <Link to="/app/business/trade">
                  Review sales & purchases
                </Link>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

export default BusinessReportsPage