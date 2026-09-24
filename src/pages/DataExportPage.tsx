import {
  useEffect,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import AppShell from '../components/AppShell'
import {
  buildBusinessTransactionsCsv,
  buildPersonalTransactionsCsv,
  safeExportFileName,
} from '../export/csvExport'
import {
  buildBusinessPortableJson,
  safeBusinessJsonFileName,
} from '../export/businessPortableExport'
import {
  buildPersonalPortableJson,
  safePersonalJsonFileName,
} from '../export/personalPortableExport'
import {
  exportDatabaseSnapshot,
  getBusinessInventoryItems,
  getBusinessOpenItems,
  getBusinessParties,
  getBusinessProfiles,
  getBusinessTradeEntries,
  getBusinessTradeLines,
  getBusinessTransactions,
  getTransactions,
  type MoneySaathiDatabaseSnapshot,
} from '../storage/db'
import type {
  BusinessInventoryItem,
  BusinessOpenItem,
  BusinessParty,
  BusinessProfile,
  BusinessTradeEntry,
  BusinessTradeLine,
  BusinessTransaction,
} from '../types/business'
import type {
  MoneyTransaction,
} from '../types/transaction'
import {
  getLocalToday,
} from '../utils/money'

import '../styles/data-export.css'

interface BusinessExportData {
  business: BusinessProfile
  transactions: BusinessTransaction[]
  parties: BusinessParty[]
  openItems: BusinessOpenItem[]
  tradeEntries: BusinessTradeEntry[]
  tradeLines: BusinessTradeLine[]
  inventoryItems: BusinessInventoryItem[]
}

interface ExportData {
  personalTransactions: MoneyTransaction[]
  personalSnapshot: MoneySaathiDatabaseSnapshot
  businesses: BusinessExportData[]
}

function downloadCsv(
  csv: string,
  fileName: string,
): void {
  const blob =
    new Blob(
      [csv],
      {
        type: 'text/csv;charset=utf-8',
      },
    )

  const objectUrl =
    URL.createObjectURL(blob)

  const anchor =
    document.createElement('a')

  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.click()

  URL.revokeObjectURL(objectUrl)
}

function downloadJson(
  json: string,
  fileName: string,
): void {
  const blob =
    new Blob(
      [json],
      {
        type: 'application/json;charset=utf-8',
      },
    )

  const objectUrl =
    URL.createObjectURL(blob)

  const anchor =
    document.createElement('a')

  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  anchor.click()

  URL.revokeObjectURL(objectUrl)
}

function DataExportPage() {
  const [today] =
    useState(() => getLocalToday())

  const [data, setData] =
    useState<ExportData | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          personalTransactions,
          businessProfiles,
          personalSnapshot,
        ] = await Promise.all([
          getTransactions(),
          getBusinessProfiles(),
          exportDatabaseSnapshot(),
        ])

        const businesses =
          await Promise.all(
            businessProfiles.map(
              async (business) => {
                const [
                  transactions,
                  parties,
                  openItems,
                  tradeEntries,
                  tradeLines,
                  inventoryItems,
                ] =
                  await Promise.all([
                    getBusinessTransactions(
                      business.id,
                    ),
                    getBusinessParties(
                      business.id,
                    ),
                    getBusinessOpenItems(
                      business.id,
                    ),
                    getBusinessTradeEntries(
                      business.id,
                    ),
                    getBusinessTradeLines(
                      business.id,
                    ),
                    getBusinessInventoryItems(
                      business.id,
                    ),
                  ])

                return {
                  business,
                  transactions,
                  parties,
                  openItems,
                  tradeEntries,
                  tradeLines,
                  inventoryItems,
                }
              },
            ),
          )

        if (!active) return

        setData({
          personalTransactions,
          personalSnapshot,
          businesses,
        })
      } catch {
        if (active) {
          setError(
            'Money Saathi could not prepare your export.',
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [])

  function exportPersonal() {
    if (!data) return

    const csv =
      buildPersonalTransactionsCsv(
        data.personalTransactions,
      )

    downloadCsv(
      csv,
      safeExportFileName(
        'Money Saathi Personal',
        today,
      ),
    )

    setMessage(
      'Personal transaction CSV prepared on this device.',
    )
  }

  function exportPersonalStructured() {
    if (!data) return

    const json =
      buildPersonalPortableJson(
        data.personalSnapshot,
        today,
      )

    downloadJson(
      json,
      safePersonalJsonFileName(
        today,
      ),
    )

    setMessage(
      'Complete personal JSON prepared on this device.',
    )
  }

  function exportBusiness(
    item: BusinessExportData,
  ) {
    const csv =
      buildBusinessTransactionsCsv(
        item.business,
        item.transactions,
      )

    downloadCsv(
      csv,
      safeExportFileName(
        `Money Saathi Business ${item.business.id.slice(0, 8)}`,
        today,
      ),
    )

    setMessage(
      `${item.business.name} CSV prepared on this device.`,
    )
  }

  function exportBusinessStructured(
    item: BusinessExportData,
  ) {
    const json =
      buildBusinessPortableJson(
        {
          business:
            item.business,
          cashTransactions:
            item.transactions,
          parties:
            item.parties,
          openItems:
            item.openItems,
          tradeEntries:
            item.tradeEntries,
          tradeLines:
            item.tradeLines,
          inventoryItems:
            item.inventoryItems,
        },
        today,
      )

    downloadJson(
      json,
      safeBusinessJsonFileName(
        item.business.name,
        today,
      ),
    )

    setMessage(
      `${item.business.name} structured JSON prepared on this device.`,
    )
  }

  if (loading) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div className="dashboard2-loading">
            Preparing your local data export...
          </div>
        </div>
      </AppShell>
    )
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="dashboard-container">
          <div
            className="dashboard2-error"
            role="alert"
          >
            {error ||
              'Money Saathi could not prepare your export.'}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="dashboard-container data-export-page">
        <header className="data-export-header">
          <div>
            <p className="dashboard-eyebrow">
              Your data belongs to you
            </p>

            <h1>Export my data</h1>

            <p>
              Create spreadsheet-friendly CSV files directly on
              this device. Money Saathi does not upload these
              exports to a server.
            </p>
          </div>

          <Link to="/app/backup">
            Encrypted backup
          </Link>
        </header>

        {message && (
          <div
            className="data-export-message"
            role="status"
          >
            {message}
          </div>
        )}

        <section className="data-export-warning">
          <strong>
            CSV files are readable plain text.
          </strong>

          <span>
            CSV and JSON exports are useful for your own review,
            spreadsheet or accountant, but they are not encrypted
            like a Money Saathi backup. Store and share them carefully.
          </span>
        </section>

        <section className="data-export-primary">
          <div>
            <p className="dashboard-eyebrow">
              Personal ledger
            </p>

            <h2>
              Personal transactions
            </h2>

            <p>
              CSV exports transaction history for spreadsheets.
              Complete personal JSON also includes budgets, regular
              money, goals, savings, deposits, loans and financial
              schemes.
            </p>

            <span>
              {data.personalTransactions.length}{' '}
              {data.personalTransactions.length === 1
                ? 'transaction'
                : 'transactions'}
            </span>
          </div>

          <div className="data-export-actions">
            <button
              type="button"
              onClick={exportPersonal}
              disabled={
                data.personalTransactions.length === 0
              }
            >
              Transactions CSV
            </button>

            <button
              type="button"
              onClick={
                exportPersonalStructured
              }
            >
              Complete personal JSON
            </button>
          </div>
        </section>

        <section className="data-export-section">
          <div className="data-export-section-heading">
            <div>
              <p className="dashboard-eyebrow">
                Separate business records
              </p>

              <h2>
                Business exports
              </h2>

              <p>
                Cash CSV stays spreadsheet-friendly. Structured JSON
                includes the complete business workspace: cash,
                customers and suppliers, dues, sales and purchases,
                item lines and inventory.
              </p>
            </div>

            <Link to="/app/business">
              Business workspace
            </Link>
          </div>

          {data.businesses.length === 0 ? (
            <div className="data-export-empty">
              No business workspace has been created.
            </div>
          ) : (
            <div className="data-export-businesses">
              {data.businesses.map(
                (item) => (
                  <article
                    key={item.business.id}
                  >
                    <div>
                      <strong>
                        {item.business.name}
                      </strong>

                      <span>
                        {item.transactions.length}{' '}
                        {item.transactions.length === 1
                          ? 'transaction'
                          : 'transactions'}
                      </span>
                    </div>

                    <div>
                      <button
                        type="button"
                        disabled={
                          item.transactions.length === 0
                        }
                        onClick={() =>
                          exportBusiness(item)
                        }
                      >
                        Cash CSV
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          exportBusinessStructured(
                            item,
                          )
                        }
                      >
                        Complete JSON
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        <section className="data-export-explainer">
          <div>
            <strong>
              Exact money values
            </strong>

            <p>
              Amounts are converted from integer chetrum into
              two-decimal Ngultrum text without floating-point
              money arithmetic.
            </p>
          </div>

          <div>
            <strong>
              Spreadsheet injection protection
            </strong>

            <p>
              User-entered text beginning with spreadsheet formula
              characters is neutralized before export.
            </p>
          </div>

          <div>
            <strong>
              Personal and business stay separate
            </strong>

            <p>
              A business CSV contains only that business workspace.
              Personal transactions are exported in their own file.
            </p>
          </div>
        </section>

        <section className="data-export-backup">
          <div>
            <strong>
              CSV is not a replacement for backup
            </strong>

            <p>
              CSV and JSON are designed for portability and review.
              They are plain readable files and are not used as a
              restore path. Use the encrypted Money Saathi backup
              when you want to preserve and later restore the app’s
              structured data safely.
            </p>
          </div>

          <Link to="/app/backup">
            Open encrypted backup
          </Link>
        </section>
      </div>
    </AppShell>
  )
}

export default DataExportPage
