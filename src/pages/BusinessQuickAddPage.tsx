import {
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  formatNu,
} from '../utils/money'
import {
  parseTransactionMessage,
  type ParsedTransactionMessage,
} from '../utils/transactionMessage'

import '../styles/business-quick-add.css'

const quickActions = [
  {
    to: '/app/business/trade',
    title: 'Sale',
    description:
      'Record what you sold, how much was paid now, and item-level COGS.',
    note:
      'Use this when goods or services were sold.',
  },
  {
    to: '/app/business/trade',
    title: 'Purchase',
    description:
      'Record stock or goods purchased for the business.',
    note:
      'Use this for purchase-register entries, not ordinary running expenses.',
  },
  {
    to: '/app/business/cash',
    title: 'Expense',
    description:
      'Record rent, transport, wages, utilities or another cash expense.',
    note:
      'This records actual business money going out.',
  },
  {
    to: '/app/business/credit',
    title: 'Payment received',
    description:
      'Update money collected from a customer who owed the business.',
    note:
      'Record the related cash movement separately when money actually arrives.',
  },
  {
    to: '/app/business/credit',
    title: 'Payment made',
    description:
      'Update money paid to a supplier the business owed.',
    note:
      'Record the related cash movement separately when money actually leaves.',
  },
] as const

function BusinessQuickAddPage() {
  const [pastedMessage, setPastedMessage] =
    useState('')

  const [
    messageAnalysis,
    setMessageAnalysis,
  ] =
    useState<ParsedTransactionMessage | null>(
      null,
    )

  const [
    messageError,
    setMessageError,
  ] =
    useState('')

  function analyzeMessage() {
    setMessageError('')

    if (!pastedMessage.trim()) {
      setMessageAnalysis(null)
      setMessageError(
        'Paste a business payment message first.',
      )
      return
    }

    const analysis =
      parseTransactionMessage(
        pastedMessage,
      )

    setMessageAnalysis(
      analysis,
    )

    if (
      analysis.amountChetrum ===
      null
    ) {
      setMessageError(
        'Money Saathi could not safely identify one payment amount. Use the normal business options below and enter the amount manually.',
      )
    }
  }

  const importedQuery =
    useMemo(
      () => {
        if (
          !messageAnalysis ||
          messageAnalysis.amountChetrum ===
            null ||
          messageAnalysis.direction ===
            'unknown'
        ) {
          return ''
        }

        const params =
          new URLSearchParams()

        params.set(
          'source',
          'message',
        )

        params.set(
          'amountChetrum',
          String(
            messageAnalysis.amountChetrum,
          ),
        )

        params.set(
          'direction',
          messageAnalysis.direction,
        )

        if (messageAnalysis.date) {
          params.set(
            'date',
            messageAnalysis.date,
          )
        }

        return params.toString()
      },
      [
        messageAnalysis,
      ],
    )

  function businessRoute(
    route: string,
    intent: string,
  ): string {
    if (!importedQuery) {
      return route
    }

    const params =
      new URLSearchParams(
        importedQuery,
      )

    params.set(
      'intent',
      intent,
    )

    return `${route}?${params.toString()}`
  }

  const messageActions =
    messageAnalysis?.direction ===
      'income'
      ? [
          {
            title:
              'Cash / QR sale',
            to:
              businessRoute(
                '/app/business/trade',
                'sale',
              ),
            note:
              'Record the sale properly, including what was sold and COGS. The bank credit alone is not enough to create a sale.',
          },
          {
            title:
              'Customer payment',
            to:
              businessRoute(
                '/app/business/credit',
                'customer-payment',
              ),
            note:
              'Use this when a customer is paying an amount they already owed.',
          },
          {
            title:
              'Other business income',
            to:
              businessRoute(
                '/app/business/cash',
                'other-income',
              ),
            note:
              'Use business cash when this is genuine business money in but not a sale or debt collection.',
          },
          {
            title:
              'Own-account / owner transfer',
            to:
              null,
            note:
              'Do not record this as business income. A transfer does not create business revenue.',
          },
        ]
      : messageAnalysis?.direction ===
          'expense'
        ? [
            {
              title:
                'Running expense',
              to:
                businessRoute(
                  '/app/business/cash',
                  'running-expense',
                ),
              note:
                'Use for rent, transport, wages, utilities or another actual business expense.',
            },
            {
              title:
                'Supplier payment',
              to:
                businessRoute(
                  '/app/business/credit',
                  'supplier-payment',
                ),
              note:
                'Use this when paying an amount the business already owed a supplier.',
            },
            {
              title:
                'Stock / goods purchase',
              to:
                businessRoute(
                  '/app/business/trade',
                  'purchase',
                ),
              note:
                'Record the purchase properly. A bank debit alone does not establish what stock was bought.',
            },
            {
              title:
                'Own-account / owner transfer',
              to:
                null,
            note:
              'Do not record this as a business expense. Moving money between your own accounts is not spending.',
            },
          ]
        : []

  return (
    <AppShell>
      <div className="dashboard-container business-quick-add-page">
        <header className="business-quick-add-header">
          <div>
            <p className="dashboard-eyebrow">
              Business
            </p>

            <h1>
              Add
            </h1>

            <p>
              Choose what happened. Money Saathi will take you to the
              right business record without mixing sales, cash and dues.
            </p>
          </div>

          <Link to="/app/business">
            Business Home
          </Link>
        </header>

        <section className="business-message-import">
          <div className="business-message-import-heading">
            <div>
              <p className="dashboard-eyebrow">
                Faster entry
              </p>

              <h2>
                Paste payment message
              </h2>
            </div>

            <span>
              Local only
            </span>
          </div>

          <p className="business-message-import-copy">
            Paste a bank, QR or payment alert. Money Saathi reads the
            message on this device and helps you choose the right business
            record. It does not create a sale, expense, due or stock entry
            automatically.
          </p>

          <label
            className="business-message-import-label"
            htmlFor="business-payment-message"
          >
            Payment message
          </label>

          <textarea
            id="business-payment-message"
            rows={5}
            maxLength={2000}
            placeholder="Example: QR payment received: Nu. 3,500.00 on 25/09/2026."
            value={pastedMessage}
            onChange={(event) => {
              setPastedMessage(
                event.target.value,
              )
              setMessageAnalysis(
                null,
              )
              setMessageError('')
            }}
          />

          <button
            type="button"
            className="business-message-read-button"
            onClick={analyzeMessage}
          >
            Read message locally
          </button>

          {messageAnalysis && (
            <div className="business-message-result">
              <strong>
                Detected payment
              </strong>

              <div className="business-message-result-grid">
                <span>
                  Amount
                  <b>
                    {messageAnalysis.amountChetrum !== null
                      ? formatNu(
                          messageAnalysis.amountChetrum,
                        )
                      : 'Not safely identified'}
                  </b>
                </span>

                <span>
                  Direction
                  <b>
                    {messageAnalysis.direction ===
                    'income'
                      ? 'Money in'
                      : messageAnalysis.direction ===
                          'expense'
                        ? 'Money out'
                        : 'Not clear'}
                  </b>
                </span>

                <span>
                  Date
                  <b>
                    {messageAnalysis.date ??
                      'Not identified'}
                  </b>
                </span>
              </div>

              {messageAnalysis.direction ===
                'unknown' ? (
                <p className="business-message-caution">
                  Money Saathi cannot safely tell whether this payment is
                  money in or money out. Choose the correct normal business
                  option below instead of guessing.
                </p>
              ) : (
                <>
                  <h3>
                    What was this payment?
                  </h3>

                  <div className="business-message-actions">
                    {messageActions.map(
                      (action) =>
                        action.to ? (
                          <Link
                            key={
                              action.title
                            }
                            to={
                              action.to
                            }
                            className="business-message-action"
                          >
                            <strong>
                              {action.title}
                            </strong>

                            <span>
                              {action.note}
                            </span>
                          </Link>
                        ) : (
                          <div
                            key={
                              action.title
                            }
                            className="business-message-action business-message-action-stop"
                          >
                            <strong>
                              {action.title}
                            </strong>

                            <span>
                              {action.note}
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </>
              )}

              <p className="business-message-caution">
                The payment amount is evidence of cash movement only. It
                does not prove a sale, purchase, customer settlement,
                supplier settlement, COGS or stock movement.
              </p>
            </div>
          )}

          {messageError && (
            <div
              className="form-error"
              role="alert"
            >
              {messageError}
            </div>
          )}
        </section>

        <section className="business-quick-add-grid">
          {quickActions.map(
            (action) => (
              <Link
                key={
                  action.title
                }
                to={
                  action.to
                }
                className="business-quick-add-card"
              >
                <span>
                  Record
                </span>

                <strong>
                  {action.title}
                </strong>

                <p>
                  {action.description}
                </p>

                <small>
                  {action.note}
                </small>
              </Link>
            ),
          )}
        </section>

        <section className="business-quick-add-boundary">
          <strong>
            Simple on the surface. Separate underneath.
          </strong>

          <span>
            A sale is not automatically cash received. A customer due is
            not cash in hand. A stock purchase is not the same thing as
            every business expense. Money Saathi keeps those records
            separate so the simple overview stays financially truthful.
          </span>
        </section>

        <section className="business-quick-add-secondary">
          <p className="dashboard-eyebrow">
            Other
          </p>

          <div>
            <Link to="/app/business/inventory">
              Stock
            </Link>

            <Link to="/app/business/credit">
              Customers & suppliers
            </Link>

            <Link to="/app/business/cash">
              Business cash
            </Link>

            <Link to="/app/business/trade">
              Sales & purchase register
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}

export default BusinessQuickAddPage