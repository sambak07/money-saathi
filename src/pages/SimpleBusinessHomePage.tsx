import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Link,
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
  formatNu,
  getLocalToday,
} from '../utils/money'

import '../styles/simple-business-home.css'

function SimpleBusinessHomePage() {
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

  const today =
    getLocalToday()

  const monthStart =
    `${today.slice(0, 7)}-01`

  const selectedBusiness =
    businesses.find(
      (business) =>
        business.id ===
        selectedBusinessId,
    ) ?? null

  const report =
    useMemo(
      () => {
        if (
          !selectedBusinessId
        ) {
          return null
        }

        try {
          return buildBusinessReport({
            startDate:
              monthStart,
            endDate:
              today,
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
        monthStart,
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

        setSelectedBusinessId(
          records[0]?.id ??
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
  }, [])

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
            'Money Saathi could not load your business position.',
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

  const attentionItems =
    useMemo(
      () => {
        if (!report) {
          return []
        }

        const items:
          string[] = []

        if (
          report.overdueReceivablesChetrum >
          0
        ) {
          items.push(
            `${formatNu(
              report.overdueReceivablesChetrum,
            )} is overdue to collect.`,
          )
        }

        if (
          report.overduePayablesChetrum >
          0
        ) {
          items.push(
            `${formatNu(
              report.overduePayablesChetrum,
            )} is overdue to pay.`,
          )
        }

        if (
          report.lowStockItemCount >
          0
        ) {
          items.push(
            `${report.lowStockItemCount} stock ${
              report.lowStockItemCount ===
              1
                ? 'item is'
                : 'items are'
            } low.`,
          )
        }

        if (
          report.negativeStockItemCount >
          0
        ) {
          items.push(
            `${report.negativeStockItemCount} stock ${
              report.negativeStockItemCount ===
              1
                ? 'item has'
                : 'items have'
            } a negative quantity and needs review.`,
          )
        }

        if (
          !report.grossMarginCoverageComplete
        ) {
          items.push(
            `${report.unverifiedSaleDocumentCount} ${
              report.unverifiedSaleDocumentCount ===
              1
                ? 'sale needs'
                : 'sales need'
            } COGS or line review before margin is complete.`,
          )
        }

        return items
      },
      [
        report,
      ],
    )

  return (
    <AppShell>
      <div className="dashboard-container simple-business-home">
        <header className="simple-business-home-header">
          <div>
            <p className="dashboard-eyebrow">
              Business
            </p>

            <h1>
              {selectedBusiness?.name ??
                'Your business'}
            </h1>

            <p>
              See the few numbers that matter, then record what
              happened.
            </p>
          </div>

          {businesses.length >
            1 && (
            <label className="simple-business-switcher">
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
        </header>

        {error && (
          <div
            className="simple-business-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {businesses.length ===
        0 ? (
          <section className="simple-business-empty">
            <strong>
              Start with one business.
            </strong>

            <p>
              Create a workspace, then Money Saathi can keep business
              money separate from personal money.
            </p>

            <Link to="/app/business/cash">
              Create business
            </Link>
          </section>
        ) : report ? (
          <>
            <section className="simple-business-hero">
              <div>
                <span>
                  Sales this month
                </span>

                <strong>
                  {formatNu(
                    report.registeredSalesChetrum,
                  )}
                </strong>

                <small>
                  Recorded sales from {monthStart} to today.
                </small>
              </div>

              <Link
                className="simple-business-primary-action"
                to="/app/business/trade"
              >
                Add sale or purchase
              </Link>
            </section>

            <section
              className="simple-business-cards"
              aria-label="Business position"
            >
              <article>
                <span>
                  Money in
                </span>

                <strong>
                  {formatNu(
                    report.recordedCashInChetrum,
                  )}
                </strong>

                <small>
                  Recorded business cash this month.
                </small>
              </article>

              <article>
                <span>
                  Money out
                </span>

                <strong>
                  {formatNu(
                    report.recordedCashOutChetrum,
                  )}
                </strong>

                <small>
                  Recorded business cash this month.
                </small>
              </article>

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
            </section>

            <section className="simple-business-secondary-grid">
              <article className="simple-business-margin-card">
                <div>
                  <span>
                    Gross margin before other expenses
                  </span>

                  <strong>
                    {formatNu(
                      report.verifiedGrossMarginBeforeOtherBusinessExpensesChetrum,
                    )}
                  </strong>
                </div>

                <p>
                  {report.grossMarginCoverageComplete
                    ? 'All recorded sale documents in this period have verifiable item lines and explicit COGS.'
                    : `Based only on verified sales. ${report.unverifiedSaleDocumentCount} ${
                        report.unverifiedSaleDocumentCount ===
                        1
                          ? 'sale is'
                          : 'sales are'
                      } not included yet.`}
                </p>

                <small>
                  This is not net profit. Rent, wages, transport,
                  utilities and other business expenses are separate.
                </small>
              </article>

              <article className="simple-business-stock-card">
                <span>
                  Stock position
                </span>

                <strong>
                  {formatNu(
                    report.estimatedStockValueChetrum,
                  )}
                </strong>

                <small>
                  Estimated from recorded current unit costs.
                </small>

                <Link to="/app/business/inventory">
                  View stock
                </Link>
              </article>
            </section>

            <section className="simple-business-actions">
              <div className="simple-business-section-heading">
                <div>
                  <p className="dashboard-eyebrow">
                    Record
                  </p>

                  <h2>
                    What happened?
                  </h2>
                </div>

                <span>
                  Keep it simple.
                </span>
              </div>

              <div className="simple-business-action-grid">
                <Link to="/app/business/trade">
                  <strong>
                    Sale or purchase
                  </strong>

                  <span>
                    Items, quantity, payment-at-entry and COGS.
                  </span>
                </Link>

                <Link to="/app/business/cash">
                  <strong>
                    Money in or out
                  </strong>

                  <span>
                    Record actual business cash movement.
                  </span>
                </Link>

                <Link to="/app/business/credit">
                  <strong>
                    Customer or supplier due
                  </strong>

                  <span>
                    Track money to collect or pay.
                  </span>
                </Link>

                <Link to="/app/business/inventory">
                  <strong>
                    Stock
                  </strong>

                  <span>
                    Add items or check low stock.
                  </span>
                </Link>
              </div>
            </section>

            <section className="simple-business-attention">
              <div className="simple-business-section-heading">
                <div>
                  <p className="dashboard-eyebrow">
                    Attention
                  </p>

                  <h2>
                    What needs you?
                  </h2>
                </div>
              </div>

              {attentionItems.length ===
              0 ? (
                <p className="simple-business-all-clear">
                  Nothing urgent is visible from the records you have
                  entered.
                </p>
              ) : (
                <ul>
                  {attentionItems.map(
                    (item) => (
                      <li key={item}>
                        {item}
                      </li>
                    ),
                  )}
                </ul>
              )}
            </section>

            <section className="simple-business-boundary">
              <strong>
                Money Saathi keeps the numbers separate on purpose.
              </strong>

              <span>
                Sales are not automatically cash received. Stock is not
                cash. Customer dues are not cash in hand. This keeps the
                overview simple without making the financial picture false.
              </span>
            </section>
          </>
        ) : (
          <section className="simple-business-empty">
            <strong>
              This business needs review.
            </strong>

            <p>
              Some saved records could not be combined safely. Open the
              detailed business screens and review incomplete sales,
              stock or dues instead of relying on a guessed summary.
            </p>

            <Link to="/app/business/trade">
              Review sales & purchases
            </Link>
          </section>
        )}
      </div>
    </AppShell>
  )
}

export default SimpleBusinessHomePage