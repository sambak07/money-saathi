import {
  type FormEvent,
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
  deleteBusinessTradeEntry,
  getBusinessInventoryItems,
  getBusinessParties,
  getBusinessProfiles,
  getBusinessTradeEntries,
  getBusinessTradeLines,
  saveBusinessTradeEntryWithLines,
} from '../storage/db'
import type {
  BusinessInventoryItem,
  BusinessParty,
  BusinessPaymentMethod,
  BusinessProfile,
  BusinessTradeEntry,
  BusinessTradeKind,
  BusinessTradeLine,
} from '../types/business'
import {
  formatBusinessQuantity,
  parseBusinessQuantityToMilliUnits,
} from '../utils/businessQuantity'
import {
  summarizeBusinessInventory,
} from '../utils/businessInventory'
import {
  summarizeBusinessTradeDocument,
  summarizeBusinessTradeEntries,
} from '../utils/businessTrade'
import {
  formatChetrumForInput,
  formatNu,
  getLocalToday,
} from '../utils/money'
import {
  formatScheduleDate,
} from '../utils/recurrence'
import {
  parseNuInputToChetrum,
} from '../utils/safeToSpend'

import '../styles/business-trade.css'

interface TradeLineDraft {
  id: string
  createdAt: number | null
  inventoryItemId: string
  quantity: string
  lineAmount: string
  cogs: string
}

function createLineDraft(): TradeLineDraft {
  return {
    id:
      crypto.randomUUID(),
    createdAt:
      null,
    inventoryItemId:
      '',
    quantity:
      '',
    lineAmount:
      '',
    cogs:
      '',
  }
}

function paymentMethodLabel(
  method: BusinessPaymentMethod,
): string {
  if (
    method ===
    'bank'
  ) {
    return 'Bank / digital'
  }

  if (
    method ===
    'mixed'
  ) {
    return 'Mixed'
  }

  if (
    method ===
    'credit'
  ) {
    return 'Credit'
  }

  if (
    method ===
    'other'
  ) {
    return 'Other'
  }

  return 'Cash'
}

function partyFitsKind(
  party: BusinessParty,
  kind: BusinessTradeKind,
): boolean {
  return (
    party.role ===
      'both' ||
    (
      kind ===
        'sale' &&
      party.role ===
        'customer'
    ) ||
    (
      kind ===
        'purchase' &&
      party.role ===
        'supplier'
    )
  )
}

function BusinessTradePage() {
  const [searchParams] =
    useSearchParams()

  const importedPayment =
    searchParams.get('source') ===
      'message'

  const importedAmountRaw =
    searchParams.get(
      'amountChetrum',
    )

  const importedAmountChetrum =
    importedAmountRaw &&
    /^\d+$/.test(
      importedAmountRaw,
    )
      ? Number(
          importedAmountRaw,
        )
      : null

  const importedDate =
    searchParams.get(
      'date',
    )

  const importedIntent =
    searchParams.get(
      'intent',
    )

  const requestedBusinessId =
    searchParams.get(
      'businessId',
    ) ?? ''

  const [businesses, setBusinesses] =
    useState<BusinessProfile[]>([])

  const [
    selectedBusinessId,
    setSelectedBusinessId,
  ] =
    useState('')

  const [
    inventoryItems,
    setInventoryItems,
  ] =
    useState<BusinessInventoryItem[]>([])

  const [parties, setParties] =
    useState<BusinessParty[]>([])

  const [entries, setEntries] =
    useState<BusinessTradeEntry[]>([])

  const [tradeLines, setTradeLines] =
    useState<BusinessTradeLine[]>([])

  const [
    editingEntry,
    setEditingEntry,
  ] =
    useState<BusinessTradeEntry | null>(
      null,
    )

  const [kind, setKind] =
    useState<BusinessTradeKind>(
      'sale',
    )

  const [partyName, setPartyName] =
    useState('')

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<BusinessPaymentMethod>(
      'cash',
    )

  const [
    paidAtEntry,
    setPaidAtEntry,
  ] =
    useState('')

  const [date, setDate] =
    useState(() => getLocalToday())

  const [reference, setReference] =
    useState('')

  const [note, setNote] =
    useState('')

  const [
    lineDrafts,
    setLineDrafts,
  ] =
    useState<TradeLineDraft[]>(
      () => [
        createLineDraft(),
      ],
    )

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const selectedBusiness =
    businesses.find(
      (business) =>
        business.id ===
        selectedBusinessId,
    ) ?? null

  const eligibleParties =
    useMemo(
      () =>
        parties.filter(
          (party) =>
            partyFitsKind(
              party,
              kind,
            ),
        ),
      [
        parties,
        kind,
      ],
    )

  const inventoryById =
    useMemo(
      () =>
        new Map(
          inventoryItems.map(
            (item) => [
              item.id,
              item,
            ],
          ),
        ),
      [
        inventoryItems,
      ],
    )

  const linesByEntryId =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            BusinessTradeLine[]
          >()

        for (
          const line of tradeLines
        ) {
          const existing =
            map.get(
              line.tradeEntryId,
            ) ??
            []

          existing.push(
            line,
          )

          map.set(
            line.tradeEntryId,
            existing,
          )
        }

        return map
      },
      [
        tradeLines,
      ],
    )

  const tradeSummary =
    useMemo(
      () =>
        summarizeBusinessTradeEntries(
          entries,
        ),
      [
        entries,
      ],
    )

  const inventorySummary =
    useMemo(
      () =>
        summarizeBusinessInventory(
          inventoryItems,
          tradeLines,
        ),
      [
        inventoryItems,
        tradeLines,
      ],
    )

  const draftTotalChetrum =
    useMemo(
      () => {
        let total =
          0n

        for (
          const draft of lineDrafts
        ) {
          const parsed =
            parseNuInputToChetrum(
              draft.lineAmount,
            )

          if (
            parsed ===
              null ||
            parsed <=
              0
          ) {
            continue
          }

          total +=
            BigInt(
              parsed,
            )

          if (
            total >
            BigInt(
              Number.MAX_SAFE_INTEGER,
            )
          ) {
            return null
          }
        }

        return Number(
          total,
        )
      },
      [
        lineDrafts,
      ],
    )

  function resetForm() {
    setEditingEntry(null)
    setKind('sale')
    setPartyName('')
    setPaymentMethod('cash')
    setPaidAtEntry('')
    setDate(
      getLocalToday(),
    )
    setReference('')
    setNote('')
    setLineDrafts([
      createLineDraft(),
    ])
  }

  async function loadWorkspace(
    businessId: string,
  ) {
    const [
      nextInventoryItems,
      nextParties,
      nextEntries,
      nextLines,
    ] =
      await Promise.all([
        getBusinessInventoryItems(
          businessId,
        ),
        getBusinessParties(
          businessId,
        ),
        getBusinessTradeEntries(
          businessId,
        ),
        getBusinessTradeLines(
          businessId,
        ),
      ])

    setInventoryItems(
      nextInventoryItems,
    )

    setParties(
      nextParties,
    )

    setEntries(
      nextEntries,
    )

    setTradeLines(
      nextLines,
    )
  }

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
            'Money Saathi could not load business workspaces.',
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
          nextInventoryItems,
          nextParties,
          nextEntries,
          nextLines,
        ] =
          await Promise.all([
            getBusinessInventoryItems(
              selectedBusinessId,
            ),
            getBusinessParties(
              selectedBusinessId,
            ),
            getBusinessTradeEntries(
              selectedBusinessId,
            ),
            getBusinessTradeLines(
              selectedBusinessId,
            ),
          ])

        if (!active) {
          return
        }

        setInventoryItems(
          nextInventoryItems,
        )

        setParties(
          nextParties,
        )

        setEntries(
          nextEntries,
        )

        setTradeLines(
          nextLines,
        )
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load the sales and purchase register.',
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

  function updateLineDraft(
    id: string,
    field:
      | 'inventoryItemId'
      | 'quantity'
      | 'lineAmount'
      | 'cogs',
    value: string,
  ) {
    setLineDrafts(
      (current) =>
        current.map(
          (draft) =>
            draft.id ===
              id
              ? {
                  ...draft,
                  [field]:
                    value,
                }
              : draft,
        ),
    )
  }

  function removeLineDraft(
    id: string,
  ) {
    setLineDrafts(
      (current) =>
        current.filter(
          (draft) =>
            draft.id !==
            id,
        ),
    )
  }

  function startEdit(
    entry: BusinessTradeEntry,
  ) {
    const existingLines =
      linesByEntryId.get(
        entry.id,
      ) ??
      []

    setEditingEntry(
      entry,
    )

    setKind(
      entry.kind,
    )

    setPartyName(
      entry.partyName,
    )

    setPaymentMethod(
      entry.paymentMethod,
    )

    setPaidAtEntry(
      formatChetrumForInput(
        entry.paidAtEntryChetrum,
      ),
    )

    setDate(
      entry.date,
    )

    setReference(
      entry.reference,
    )

    setNote(
      entry.note,
    )

    setLineDrafts(
      existingLines.length >
        0
        ? existingLines.map(
            (line) => ({
              id:
                line.id,
              createdAt:
                line.createdAt,
              inventoryItemId:
                line.inventoryItemId,
              quantity:
                formatBusinessQuantity(
                  line.quantityMilliUnits,
                ),
              lineAmount:
                formatChetrumForInput(
                  line.lineAmountChetrum,
                ),
              cogs:
                entry.kind ===
                  'sale'
                  ? formatChetrumForInput(
                      line.costOfGoodsSoldChetrum,
                    )
                  : '',
            }),
          )
        : [
            createLineDraft(),
          ],
    )

    setMessage('')
    setError('')
  }

  async function saveTrade(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!selectedBusiness) {
      setError(
        'Choose a business first.',
      )
      return
    }

    if (
      lineDrafts.length ===
      0
    ) {
      setError(
        'Add at least one item line.',
      )
      return
    }

    const now =
      Date.now()

    const entryId =
      editingEntry?.id ??
      crypto.randomUUID()

    const nextLines:
      BusinessTradeLine[] =
      []

    let total =
      0n

    for (
      const draft of lineDrafts
    ) {
      const item =
        inventoryById.get(
          draft.inventoryItemId,
        )

      if (!item) {
        setError(
          'Choose an inventory item for every line.',
        )
        return
      }

      const quantityMilliUnits =
        parseBusinessQuantityToMilliUnits(
          draft.quantity,
        )

      if (
        quantityMilliUnits ===
          null ||
        quantityMilliUnits <=
          0
      ) {
        setError(
          'Every line needs a quantity greater than zero with no more than three decimal places.',
        )
        return
      }

      const lineAmountChetrum =
        parseNuInputToChetrum(
          draft.lineAmount,
        )

      if (
        lineAmountChetrum ===
          null ||
        lineAmountChetrum <=
          0
      ) {
        setError(
          'Every line needs an amount greater than zero.',
        )
        return
      }

      const cogs =
        kind ===
          'sale'
          ? parseNuInputToChetrum(
              draft.cogs ||
                '0',
            )
          : 0

      if (
        cogs ===
        null
      ) {
        setError(
          'Enter a valid COGS amount for each sale line.',
        )
        return
      }

      total +=
        BigInt(
          lineAmountChetrum,
        )

      if (
        total >
        BigInt(
          Number.MAX_SAFE_INTEGER,
        )
      ) {
        setError(
          'The document total is too large for Money Saathi.',
        )
        return
      }

      nextLines.push({
        id:
          draft.id,
        businessId:
          selectedBusiness.id,
        tradeEntryId:
          entryId,
        inventoryItemId:
          item.id,
        itemName:
          item.name,
        kind,
        quantityMilliUnits,
        lineAmountChetrum,
        costOfGoodsSoldChetrum:
          kind ===
            'sale'
            ? cogs
            : 0,
        createdAt:
          draft.createdAt ??
          now,
        updatedAt:
          now,
      })
    }

    const totalChetrum =
      Number(
        total,
      )

    const paidChetrum =
      parseNuInputToChetrum(
        paidAtEntry ||
          '0',
      )

    if (
      paidChetrum ===
      null ||
      paidChetrum >
        totalChetrum
    ) {
      setError(
        'Paid at entry must be between zero and the document total.',
      )
      return
    }

    const entry:
      BusinessTradeEntry = {
        id:
          entryId,
        businessId:
          selectedBusiness.id,
        kind,
        partyName:
          partyName.trim(),
        totalChetrum,
        paidAtEntryChetrum:
          paidChetrum,
        paymentMethod,
        date,
        reference:
          reference.trim(),
        note:
          note.trim(),
        createdAt:
          editingEntry?.createdAt ??
          now,
        updatedAt:
          now,
      }

    try {
      summarizeBusinessTradeDocument(
        entry,
        nextLines,
      )

      const wasEditing =
        editingEntry !==
        null

      await saveBusinessTradeEntryWithLines(
        entry,
        nextLines,
      )

      await loadWorkspace(
        selectedBusiness.id,
      )

      resetForm()

      setMessage(
        wasEditing
          ? 'Register entry updated.'
          : 'Register entry saved.',
      )
    } catch (
      saveError
    ) {
      setError(
        saveError instanceof
          Error
          ? saveError.message
          : 'Money Saathi could not save this register entry.',
      )
    }
  }

  async function removeTrade(
    entry: BusinessTradeEntry,
  ) {
    if (
      !window.confirm(
        `Delete this ${entry.kind} register entry and all of its item lines? This does not delete separate cash or dues records.`,
      )
    ) {
      return
    }

    setMessage('')
    setError('')

    try {
      await deleteBusinessTradeEntry(
        entry.id,
      )

      if (
        selectedBusiness
      ) {
        await loadWorkspace(
          selectedBusiness.id,
        )
      }

      if (
        editingEntry?.id ===
        entry.id
      ) {
        resetForm()
      }

      setMessage(
        'Register entry deleted.',
      )
    } catch {
      setError(
        'Money Saathi could not delete this register entry.',
      )
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container business-trade-page">
        <header className="business-trade-header">
          <div>
            <p className="dashboard-eyebrow">
              Business 2.0
            </p>

            <h1>
              Sales & purchases
            </h1>

            <p>
              Record item-level sales and purchases with quantity,
              payment-at-entry and explicit sale COGS.
            </p>
          </div>

          <div className="business-trade-header-actions">
            <Link to="/app/business/inventory">
              Inventory
            </Link>

            <Link to="/app/business/credit">
              Customers & dues
            </Link>

            <Link to="/app/business">
              Business Home
            </Link>
          </div>
        </header>

        {importedPayment && (
          <div
            className="business-trade-message"
            role="status"
          >
            Imported payment context:{' '}
            {importedAmountChetrum !==
              null &&
            Number.isSafeInteger(
              importedAmountChetrum,
            )
              ? formatNu(
                  importedAmountChetrum,
                )
              : 'amount not safely identified'}
            {importedDate
              ? ` on ${importedDate}`
              : ''}.
            {' '}
            {importedIntent ===
            'sale'
              ? 'Record the actual sale lines, quantities and COGS. The payment amount is not automatically the sale total.'
              : importedIntent ===
                  'purchase'
                ? 'Record the actual purchased items and quantities. The payment amount is not automatically the purchase total.'
                : 'Review the actual sale or purchase details.'}
            {' '}
            No trade or stock record has been created automatically.
          </div>
        )}

        {message && (
          <div
            className="business-trade-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="business-trade-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {businesses.length ===
        0 ? (
          <section className="business-trade-empty">
            <strong>
              Create a Business workspace first.
            </strong>

            <p>
              Sales and purchases stay inside a specific business and
              never enter the personal ledger.
            </p>

            <Link to="/app/business">
              Open Business
            </Link>
          </section>
        ) : (
          <>
            <section className="business-trade-selector">
              <label htmlFor="business-trade-select">
                Current business
              </label>

              <select
                id="business-trade-select"
                value={
                  selectedBusinessId
                }
                onChange={
                  (event) => {
                    resetForm()
                    setSelectedBusinessId(
                      event.target.value,
                    )
                    setMessage('')
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
            </section>

            <section
              className="business-trade-summary-grid"
              aria-label="Sales and purchases summary"
            >
              <article>
                <span>
                  Registered sales
                </span>

                <strong className="income-text">
                  {formatNu(
                    tradeSummary.salesChetrum,
                  )}
                </strong>

                <small>
                  Sum of recorded sale documents.
                </small>
              </article>

              <article>
                <span>
                  Registered purchases
                </span>

                <strong>
                  {formatNu(
                    tradeSummary.purchasesChetrum,
                  )}
                </strong>

                <small>
                  Sum of recorded purchase documents.
                </small>
              </article>

              <article>
                <span>
                  Unpaid sales at entry
                </span>

                <strong>
                  {formatNu(
                    tradeSummary.creditSalesAtEntryChetrum,
                  )}
                </strong>

                <small>
                  Historical entry-time figure, not current receivables.
                </small>
              </article>

              <article>
                <span>
                  Gross margin before other expenses
                </span>

                <strong>
                  {formatNu(
                    inventorySummary.grossMarginBeforeOtherBusinessExpensesChetrum,
                  )}
                </strong>

                <small>
                  Recorded sale-line amounts minus explicit COGS. Not profit.
                </small>
              </article>
            </section>

            <section className="business-trade-boundary">
              <strong>
                Register, cash and dues remain separate.
              </strong>

              <span>
                Saving a sale or purchase here does not automatically
                create a Business cash transaction or a receivable/payable.
                Record actual cash movement in Business and current dues
                in Customers & dues.
              </span>
            </section>

            <section className="business-trade-layout">
              <article className="business-trade-panel">
                <p className="dashboard-eyebrow">
                  Register entry
                </p>

                <h2>
                  {editingEntry
                    ? `Edit ${editingEntry.kind}`
                    : kind ===
                        'sale'
                      ? 'Record sale'
                      : 'Record purchase'}
                </h2>

                {editingEntry && (
                  <button
                    type="button"
                    className="business-trade-secondary-button"
                    onClick={
                      resetForm
                    }
                  >
                    Cancel edit
                  </button>
                )}

                <form
                  className="business-trade-form"
                  onSubmit={
                    saveTrade
                  }
                >
                  <div className="business-trade-kind-toggle">
                    <button
                      type="button"
                      aria-pressed={
                        kind ===
                        'sale'
                      }
                      className={
                        kind ===
                        'sale'
                          ? 'selected'
                          : ''
                      }
                      disabled={
                        editingEntry !==
                        null
                      }
                      onClick={() =>
                        setKind(
                          'sale',
                        )
                      }
                    >
                      Sale
                    </button>

                    <button
                      type="button"
                      aria-pressed={
                        kind ===
                        'purchase'
                      }
                      className={
                        kind ===
                        'purchase'
                          ? 'selected'
                          : ''
                      }
                      disabled={
                        editingEntry !==
                        null
                      }
                      onClick={() =>
                        setKind(
                          'purchase',
                        )
                      }
                    >
                      Purchase
                    </button>
                  </div>

                  {editingEntry && (
                    <div className="business-trade-form-note">
                      Document type is fixed while editing. Delete and
                      recreate the entry if the type itself is wrong.
                    </div>
                  )}

                  <label>
                    {kind ===
                    'sale'
                      ? 'Customer'
                      : 'Supplier'}{' '}
                    (optional)
                    <input
                      type="text"
                      list="business-trade-parties"
                      maxLength={
                        120
                      }
                      value={
                        partyName
                      }
                      onChange={
                        (event) =>
                          setPartyName(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <datalist id="business-trade-parties">
                    {eligibleParties.map(
                      (party) => (
                        <option
                          key={
                            party.id
                          }
                          value={
                            party.name
                          }
                        />
                      ),
                    )}
                  </datalist>

                  <div className="business-trade-form-grid">
                    <label>
                      Date
                      <input
                        type="date"
                        value={
                          date
                        }
                        onChange={
                          (event) =>
                            setDate(
                              event.target.value,
                            )
                        }
                      />
                    </label>

                    <label>
                      Payment method
                      <select
                        value={
                          paymentMethod
                        }
                        onChange={
                          (event) =>
                            setPaymentMethod(
                              event.target.value as BusinessPaymentMethod,
                            )
                        }
                      >
                        <option value="cash">
                          Cash
                        </option>
                        <option value="bank">
                          Bank / digital
                        </option>
                        <option value="credit">
                          Credit
                        </option>
                        <option value="mixed">
                          Mixed
                        </option>
                        <option value="other">
                          Other
                        </option>
                      </select>
                    </label>
                  </div>

                  <div className="business-trade-form-grid">
                    <label>
                      Paid at entry (Nu.)
                      <input
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        value={
                          paidAtEntry
                        }
                        onChange={
                          (event) =>
                            setPaidAtEntry(
                              event.target.value,
                            )
                        }
                      />
                    </label>

                    <div className="business-trade-readonly-total">
                      <span>
                        Document total
                      </span>

                      <strong>
                        {draftTotalChetrum ===
                        null
                          ? 'Too large'
                          : formatNu(
                              draftTotalChetrum,
                            )}
                      </strong>

                      <small>
                        Calculated from item lines.
                      </small>
                    </div>
                  </div>

                  <label>
                    Reference (optional)
                    <input
                      type="text"
                      maxLength={
                        160
                      }
                      placeholder="Invoice, bill or voucher"
                      value={
                        reference
                      }
                      onChange={
                        (event) =>
                          setReference(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Note (optional)
                    <input
                      type="text"
                      maxLength={
                        500
                      }
                      value={
                        note
                      }
                      onChange={
                        (event) =>
                          setNote(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <div className="business-trade-lines-heading">
                    <div>
                      <strong>
                        Item lines
                      </strong>

                      <span>
                        Total is calculated from these lines.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setLineDrafts(
                          (current) => [
                            ...current,
                            createLineDraft(),
                          ],
                        )
                      }
                    >
                      Add line
                    </button>
                  </div>

                  <div className="business-trade-line-list">
                    {lineDrafts.length ===
                    0 ? (
                      <div className="business-trade-inline-empty">
                        Add at least one item line.
                      </div>
                    ) : (
                      lineDrafts.map(
                        (
                          draft,
                          index,
                        ) => {
                          const selectedItem =
                            inventoryById.get(
                              draft.inventoryItemId,
                            )

                          return (
                            <fieldset
                              key={
                                draft.id
                              }
                              className="business-trade-line-card"
                            >
                              <legend>
                                Line{' '}
                                {index +
                                  1}
                              </legend>

                              <label>
                                Inventory item
                                <select
                                  value={
                                    draft.inventoryItemId
                                  }
                                  onChange={
                                    (event) =>
                                      updateLineDraft(
                                        draft.id,
                                        'inventoryItemId',
                                        event.target.value,
                                      )
                                  }
                                >
                                  <option value="">
                                    Choose item
                                  </option>

                                  {inventoryItems
                                    .filter(
                                      (item) =>
                                        item.active ||
                                        item.id ===
                                          draft.inventoryItemId,
                                    )
                                    .map(
                                      (item) => (
                                        <option
                                          key={
                                            item.id
                                          }
                                          value={
                                            item.id
                                          }
                                        >
                                          {item.name}
                                          {!item.active
                                            ? ' (archived)'
                                            : ''}
                                        </option>
                                      ),
                                    )}
                                </select>
                              </label>

                              <div className="business-trade-line-grid">
                                <label>
                                  Quantity
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="1"
                                    value={
                                      draft.quantity
                                    }
                                    onChange={
                                      (event) =>
                                        updateLineDraft(
                                          draft.id,
                                          'quantity',
                                          event.target.value,
                                        )
                                    }
                                  />
                                </label>

                                <label>
                                  Line amount (Nu.)
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    value={
                                      draft.lineAmount
                                    }
                                    onChange={
                                      (event) =>
                                        updateLineDraft(
                                          draft.id,
                                          'lineAmount',
                                          event.target.value,
                                        )
                                    }
                                  />
                                </label>
                              </div>

                              {kind ===
                                'sale' && (
                                <label>
                                  COGS for this sale line (Nu.)
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    autoComplete="off"
                                    placeholder="0"
                                    value={
                                      draft.cogs
                                    }
                                    onChange={
                                      (event) =>
                                        updateLineDraft(
                                          draft.id,
                                          'cogs',
                                          event.target.value,
                                        )
                                    }
                                  />

                                  <small>
                                    Enter COGS explicitly.
                                    {selectedItem
                                      ? ` Recorded current unit cost reference: ${formatNu(
                                          selectedItem.currentUnitCostChetrum,
                                        )}.`
                                      : ''}
                                  </small>
                                </label>
                              )}

                              {selectedItem && (
                                <div className="business-trade-line-reference">
                                  <span>
                                    Unit: {selectedItem.unit}
                                  </span>

                                  <span>
                                    Current recorded stock:{' '}
                                    {formatBusinessQuantity(
                                      inventorySummary.items.find(
                                        (position) =>
                                          position.inventoryItemId ===
                                          selectedItem.id,
                                      )?.quantityMilliUnits ??
                                        0,
                                    )}
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                className="business-trade-remove-line"
                                onClick={() =>
                                  removeLineDraft(
                                    draft.id,
                                  )
                                }
                              >
                                Remove line
                              </button>
                            </fieldset>
                          )
                        },
                      )
                    )}
                  </div>

                  {inventoryItems.filter(
                    (item) =>
                      item.active,
                  ).length ===
                    0 && (
                    <div className="business-trade-form-note">
                      No active inventory items are available. Add or
                      reactivate stock in Inventory first.
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      inventoryItems.length ===
                        0 ||
                      lineDrafts.length ===
                        0
                    }
                  >
                    {editingEntry
                      ? 'Update register entry'
                      : 'Save register entry'}
                  </button>
                </form>
              </article>

              <article className="business-trade-panel">
                <div className="business-trade-panel-heading">
                  <div>
                    <p className="dashboard-eyebrow">
                      Register
                    </p>

                    <h2>
                      {selectedBusiness?.name ??
                        'Business'}
                    </h2>
                  </div>

                  <span>
                    {entries.length}{' '}
                    {entries.length ===
                    1
                      ? 'document'
                      : 'documents'}
                  </span>
                </div>

                {entries.length ===
                0 ? (
                  <div className="business-trade-inline-empty">
                    No sales or purchases recorded yet.
                  </div>
                ) : (
                  <div className="business-trade-register-list">
                    {entries.map(
                      (entry) => {
                        const entryLines =
                          linesByEntryId.get(
                            entry.id,
                          ) ??
                          []

                        const documentSummary =
                          (() => {
                            try {
                              return summarizeBusinessTradeDocument(
                                entry,
                                entryLines,
                              )
                            } catch {
                              return null
                            }
                          })()

                        return (
                          <article
                            key={
                              entry.id
                            }
                            className="business-trade-register-row"
                          >
                            <div className="business-trade-register-main">
                              <span className="business-trade-kind-badge">
                                {entry.kind ===
                                'sale'
                                  ? 'Sale'
                                  : 'Purchase'}
                              </span>

                              <strong>
                                {entry.partyName ||
                                  (entry.kind ===
                                  'sale'
                                    ? 'Walk-in / unnamed customer'
                                    : 'Unnamed supplier')}
                              </strong>

                              <small>
                                {formatScheduleDate(
                                  entry.date,
                                )}
                                {entry.reference
                                  ? ` · ${entry.reference}`
                                  : ''}
                                {' · '}
                                {paymentMethodLabel(
                                  entry.paymentMethod,
                                )}
                              </small>
                            </div>

                            <div className="business-trade-register-money">
                              <span>
                                Total
                              </span>

                              <strong
                                className={
                                  entry.kind ===
                                  'sale'
                                    ? 'income-text'
                                    : ''
                                }
                              >
                                {formatNu(
                                  entry.totalChetrum,
                                )}
                              </strong>

                              <small>
                                Paid at entry{' '}
                                {formatNu(
                                  entry.paidAtEntryChetrum,
                                )}
                              </small>
                            </div>

                            <div className="business-trade-register-detail">
                              <span>
                                {entryLines.length}{' '}
                                {entryLines.length ===
                                1
                                  ? 'item line'
                                  : 'item lines'}
                              </span>

                              <small>
                                {documentSummary
                                  ? `Unpaid at entry ${formatNu(
                                      documentSummary.unpaidAtEntryChetrum,
                                    )}`
                                  : 'Needs review — document lines are incomplete'}
                              </small>

                              {entry.kind ===
                                'sale' &&
                                documentSummary && (
                                <small>
                                  Gross margin before other expenses{' '}
                                  {formatNu(
                                    documentSummary.grossMarginBeforeOtherBusinessExpensesChetrum ??
                                      0,
                                  )}
                                </small>
                              )}
                            </div>

                            <div className="business-trade-register-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(
                                    entry,
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  void removeTrade(
                                    entry,
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </article>
                        )
                      },
                    )}
                  </div>
                )}
              </article>
            </section>

            <section className="business-trade-footer-note">
              <strong>
                What the figures mean
              </strong>

              <span>
                Sales and purchases are register totals. Paid at entry
                is historical information captured when the document was
                recorded. Unpaid at entry is not a live receivable/payable.
                Gross margin is sale-line amount minus explicit COGS before
                rent, wages, transport, utilities and other business expenses.
              </span>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default BusinessTradePage