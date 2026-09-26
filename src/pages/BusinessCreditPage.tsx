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
  deleteBusinessOpenItem,
  deleteBusinessParty,
  getBusinessOpenItems,
  getBusinessParties,
  getBusinessProfiles,
  upsertBusinessOpenItem,
  upsertBusinessParty,
} from '../storage/db'
import type {
  BusinessOpenItem,
  BusinessOpenItemDirection,
  BusinessParty,
  BusinessPartyRole,
  BusinessProfile,
} from '../types/business'
import {
  summarizeBusinessCredit,
} from '../utils/businessCredit'
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

import '../styles/business-credit.css'

function roleLabel(
  role: BusinessPartyRole,
): string {
  if (
    role ===
    'both'
  ) {
    return 'Customer & supplier'
  }

  return role ===
    'customer'
    ? 'Customer'
    : 'Supplier'
}

function directionLabel(
  direction: BusinessOpenItemDirection,
): string {
  return direction ===
    'receivable'
    ? 'Customer owes business'
    : 'Business owes supplier'
}

function roleAllowsDirection(
  role: BusinessPartyRole,
  direction: BusinessOpenItemDirection,
): boolean {
  return (
    role ===
      'both' ||
    (
      role ===
        'customer' &&
      direction ===
        'receivable'
    ) ||
    (
      role ===
        'supplier' &&
      direction ===
        'payable'
    )
  )
}

function BusinessCreditPage() {
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

  const [today] =
    useState(() => getLocalToday())

  const [businesses, setBusinesses] =
    useState<BusinessProfile[]>([])

  const [
    selectedBusinessId,
    setSelectedBusinessId,
  ] =
    useState('')

  const [parties, setParties] =
    useState<BusinessParty[]>([])

  const [openItems, setOpenItems] =
    useState<BusinessOpenItem[]>([])

  const [
    editingParty,
    setEditingParty,
  ] =
    useState<BusinessParty | null>(
      null,
    )

  const [partyName, setPartyName] =
    useState('')

  const [
    partyRole,
    setPartyRole,
  ] =
    useState<BusinessPartyRole>(
      'customer',
    )

  const [partyPhone, setPartyPhone] =
    useState('')

  const [partyNote, setPartyNote] =
    useState('')

  const [
    editingOpenItem,
    setEditingOpenItem,
  ] =
    useState<BusinessOpenItem | null>(
      null,
    )

  const [
    direction,
    setDirection,
  ] =
    useState<BusinessOpenItemDirection>(
      'receivable',
    )

  const [partyId, setPartyId] =
    useState('')

  const [amount, setAmount] =
    useState('')

  const [
    outstandingAmount,
    setOutstandingAmount,
  ] =
    useState('')

  const [itemDate, setItemDate] =
    useState(today)

  const [dueDate, setDueDate] =
    useState('')

  const [reference, setReference] =
    useState('')

  const [itemNote, setItemNote] =
    useState('')

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
            roleAllowsDirection(
              party.role,
              direction,
            ),
        ),
      [
        parties,
        direction,
      ],
    )

  const partyById =
    useMemo(
      () =>
        new Map(
          parties.map(
            (party) => [
              party.id,
              party,
            ],
          ),
        ),
      [parties],
    )

  const summary =
    useMemo(
      () =>
        summarizeBusinessCredit(
          today,
          parties,
          openItems,
        ),
      [
        today,
        parties,
        openItems,
      ],
    )

  function resetPartyForm() {
    setEditingParty(null)
    setPartyName('')
    setPartyRole(
      'customer',
    )
    setPartyPhone('')
    setPartyNote('')
  }

  function resetOpenItemForm() {
    setEditingOpenItem(
      null,
    )
    setDirection(
      'receivable',
    )
    setPartyId('')
    setAmount('')
    setOutstandingAmount('')
    setItemDate(today)
    setDueDate('')
    setReference('')
    setItemNote('')
  }

  async function loadWorkspace(
    businessId: string,
  ) {
    if (!businessId) {
      setParties([])
      setOpenItems([])
      return
    }

    const [
      nextParties,
      nextOpenItems,
    ] =
      await Promise.all([
        getBusinessParties(
          businessId,
        ),
        getBusinessOpenItems(
          businessId,
        ),
      ])

    setParties(
      nextParties,
    )

    setOpenItems(
      nextOpenItems,
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

        setSelectedBusinessId(
          records[0]?.id ??
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
          nextParties,
          nextOpenItems,
        ] =
          await Promise.all([
            getBusinessParties(
              selectedBusinessId,
            ),
            getBusinessOpenItems(
              selectedBusinessId,
            ),
          ])

        if (!active) {
          return
        }

        setParties(
          nextParties,
        )

        setOpenItems(
          nextOpenItems,
        )
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load customers, suppliers and dues.',
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
    today,
  ])

  function startPartyEdit(
    party: BusinessParty,
  ) {
    setEditingParty(
      party,
    )
    setPartyName(
      party.name,
    )
    setPartyRole(
      party.role,
    )
    setPartyPhone(
      party.phone,
    )
    setPartyNote(
      party.note,
    )
    setMessage('')
    setError('')
  }

  async function saveParty(
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

    const name =
      partyName.trim()

    if (
      name.length <
      2
    ) {
      setError(
        'Enter a clear customer or supplier name.',
      )
      return
    }

    if (editingParty) {
      const incompatible =
        openItems.some(
          (item) =>
            item.partyId ===
              editingParty.id &&
            !roleAllowsDirection(
              partyRole,
              item.direction,
            ),
        )

      if (incompatible) {
        setError(
          'This party already has credit records that do not fit the selected role. Use Customer & supplier or settle/delete those records first.',
        )
        return
      }
    }

    const now =
      Date.now()

    const record:
      BusinessParty = {
        id:
          editingParty?.id ??
          crypto.randomUUID(),
        businessId:
          selectedBusiness.id,
        name,
        role:
          partyRole,
        phone:
          partyPhone.trim(),
        note:
          partyNote.trim(),
        createdAt:
          editingParty?.createdAt ??
          now,
        updatedAt:
          now,
      }

    try {
      await upsertBusinessParty(
        record,
      )

      await loadWorkspace(
        selectedBusiness.id,
      )

      resetPartyForm()

      setMessage(
        editingParty
          ? 'Business party updated.'
          : 'Business party added.',
      )
    } catch {
      setError(
        'Money Saathi could not save this customer or supplier.',
      )
    }
  }

  async function removeParty(
    party: BusinessParty,
  ) {
    const relatedCount =
      openItems.filter(
        (item) =>
          item.partyId ===
          party.id,
      ).length

    const detail =
      relatedCount > 0
        ? ` This will also delete ${relatedCount} linked receivable/payable ${relatedCount === 1 ? 'record' : 'records'}.`
        : ''

    if (
      !window.confirm(
        `Delete "${party.name}"?${detail} This cannot be undone.`,
      )
    ) {
      return
    }

    setMessage('')
    setError('')

    try {
      await deleteBusinessParty(
        party.id,
      )

      if (
        selectedBusiness
      ) {
        await loadWorkspace(
          selectedBusiness.id,
        )
      }

      if (
        editingParty?.id ===
        party.id
      ) {
        resetPartyForm()
      }

      setMessage(
        'Customer/supplier record deleted.',
      )
    } catch {
      setError(
        'Money Saathi could not delete this customer or supplier.',
      )
    }
  }

  function changeDirection(
    next:
      BusinessOpenItemDirection,
  ) {
    setDirection(
      next,
    )

    const selectedParty =
      parties.find(
        (party) =>
          party.id ===
          partyId,
      )

    if (
      selectedParty &&
      !roleAllowsDirection(
        selectedParty.role,
        next,
      )
    ) {
      setPartyId('')
    }
  }

  function startOpenItemEdit(
    item: BusinessOpenItem,
  ) {
    setEditingOpenItem(
      item,
    )
    setDirection(
      item.direction,
    )
    setPartyId(
      item.partyId,
    )
    setAmount(
      formatChetrumForInput(
        item.originalAmountChetrum,
      ),
    )
    setOutstandingAmount(
      formatChetrumForInput(
        item.outstandingAmountChetrum,
      ),
    )
    setItemDate(
      item.date,
    )
    setDueDate(
      item.dueDate,
    )
    setReference(
      item.reference,
    )
    setItemNote(
      item.note,
    )
    setMessage('')
    setError('')
  }

  async function saveOpenItem(
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

    const selectedParty =
      parties.find(
        (party) =>
          party.id ===
          partyId,
      )

    if (
      !selectedParty ||
      !roleAllowsDirection(
        selectedParty.role,
        direction,
      )
    ) {
      setError(
        direction ===
          'receivable'
          ? 'Choose a customer for this receivable.'
          : 'Choose a supplier for this payable.',
      )
      return
    }

    const amountChetrum =
      parseNuInputToChetrum(
        amount,
      )

    if (
      amountChetrum ===
        null ||
      amountChetrum <=
        0
    ) {
      setError(
        'Enter a valid original amount greater than zero.',
      )
      return
    }

    const outstandingChetrum =
      outstandingAmount.trim() ===
        ''
        ? amountChetrum
        : parseNuInputToChetrum(
            outstandingAmount,
          )

    if (
      outstandingChetrum ===
      null ||
      outstandingChetrum <
        0 ||
      outstandingChetrum >
        amountChetrum
    ) {
      setError(
        'Outstanding amount must be between zero and the original amount.',
      )
      return
    }

    if (
      dueDate &&
      dueDate <
        itemDate
    ) {
      setError(
        'Due date cannot be earlier than the record date.',
      )
      return
    }

    const now =
      Date.now()

    const record:
      BusinessOpenItem = {
        id:
          editingOpenItem?.id ??
          crypto.randomUUID(),
        businessId:
          selectedBusiness.id,
        partyId:
          selectedParty.id,
        direction,
        originalAmountChetrum:
          amountChetrum,
        outstandingAmountChetrum:
          outstandingChetrum,
        date:
          itemDate,
        dueDate,
        reference:
          reference.trim(),
        note:
          itemNote.trim(),
        createdAt:
          editingOpenItem?.createdAt ??
          now,
        updatedAt:
          now,
      }

    try {
      await upsertBusinessOpenItem(
        record,
      )

      await loadWorkspace(
        selectedBusiness.id,
      )

      const wasEditing =
        editingOpenItem !==
        null

      resetOpenItemForm()

      setMessage(
        wasEditing
          ? 'Receivable/payable updated.'
          : 'Receivable/payable recorded.',
      )
    } catch {
      setError(
        'Money Saathi could not save this receivable or payable.',
      )
    }
  }

  async function settleOpenItem(
    item: BusinessOpenItem,
  ) {
    if (
      item.outstandingAmountChetrum ===
      0
    ) {
      return
    }

    if (
      !window.confirm(
        `Mark this ${item.direction} as fully settled? This changes only the outstanding credit record. Record actual cash movement separately in Business when money is received or paid.`,
      )
    ) {
      return
    }

    setMessage('')
    setError('')

    try {
      await upsertBusinessOpenItem({
        ...item,
        outstandingAmountChetrum:
          0,
        updatedAt:
          Date.now(),
      })

      if (
        selectedBusiness
      ) {
        await loadWorkspace(
          selectedBusiness.id,
        )
      }

      setMessage(
        'Outstanding amount marked as settled. Cash activity remains separate.',
      )
    } catch {
      setError(
        'Money Saathi could not settle this receivable or payable.',
      )
    }
  }

  async function removeOpenItem(
    item: BusinessOpenItem,
  ) {
    if (
      !window.confirm(
        `Delete this ${item.direction} record? This cannot be undone.`,
      )
    ) {
      return
    }

    setMessage('')
    setError('')

    try {
      await deleteBusinessOpenItem(
        item.id,
      )

      if (
        selectedBusiness
      ) {
        await loadWorkspace(
          selectedBusiness.id,
        )
      }

      if (
        editingOpenItem?.id ===
        item.id
      ) {
        resetOpenItemForm()
      }

      setMessage(
        'Receivable/payable record deleted.',
      )
    } catch {
      setError(
        'Money Saathi could not delete this receivable or payable.',
      )
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container business-credit-page">
        <header className="business-credit-header">
          <div>
            <p className="dashboard-eyebrow">
              Business 2.0
            </p>

            <h1>
              Customers, suppliers & dues
            </h1>

            <p>
              Track who owes the business and whom the business owes.
              Credit records stay separate from the cash transactions
              in your Business workspace.
            </p>
          </div>

          <Link to="/app/business">
            Business cash
          </Link>
        </header>

        {importedPayment && (
          <div
            className="business-credit-message"
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
            'customer-payment'
              ? 'Choose the correct customer and update only the receivable that this payment actually settles.'
              : importedIntent ===
                  'supplier-payment'
                ? 'Choose the correct supplier and update only the payable that this payment actually settles.'
                : 'Review the correct customer or supplier record.'}
            {' '}
            Money Saathi has not changed any due automatically.
          </div>
        )}

        {message && (
          <div
            className="business-credit-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="business-credit-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {businesses.length ===
        0 ? (
          <section className="business-credit-empty">
            <strong>
              Create a Business workspace first.
            </strong>

            <p>
              Customers, suppliers, receivables and payables belong
              to a specific business and never enter your personal
              ledger.
            </p>

            <Link to="/app/business">
              Open Business
            </Link>
          </section>
        ) : (
          <>
            <section className="business-credit-selector">
              <label htmlFor="business-credit-select">
                Current business
              </label>

              <select
                id="business-credit-select"
                value={
                  selectedBusinessId
                }
                onChange={
                  (event) => {
                    resetPartyForm()
                    resetOpenItemForm()
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
              className="business-credit-summary-grid"
              aria-label="Business credit summary"
            >
              <article>
                <span>
                  Customers owe business
                </span>

                <strong className="income-text">
                  {formatNu(
                    summary.openReceivableChetrum,
                  )}
                </strong>

                <small>
                  Outstanding receivables only.
                </small>
              </article>

              <article>
                <span>
                  Business owes suppliers
                </span>

                <strong>
                  {formatNu(
                    summary.openPayableChetrum,
                  )}
                </strong>

                <small>
                  Outstanding payables only.
                </small>
              </article>

              <article>
                <span>
                  Net open position
                </span>

                <strong
                  className={
                    summary.netOpenPositionChetrum >=
                    0
                      ? 'income-text'
                      : ''
                  }
                >
                  {formatNu(
                    summary.netOpenPositionChetrum,
                  )}
                </strong>

                <small>
                  Receivables minus payables. Not cash or profit.
                </small>
              </article>

              <article>
                <span>
                  Overdue open items
                </span>

                <strong>
                  {summary.overdueItemCount}
                </strong>

                <small>
                  Receivable{' '}
                  {formatNu(
                    summary.overdueReceivableChetrum,
                  )}{' '}
                  · Payable{' '}
                  {formatNu(
                    summary.overduePayableChetrum,
                  )}
                </small>
              </article>
            </section>

            <section className="business-credit-boundary">
              <strong>
                Credit and cash are different.
              </strong>

              <span>
                Reducing an outstanding receivable or payable here
                does not create a Business cash transaction. When
                money is actually received or paid, record that cash
                movement separately in Business.
              </span>
            </section>

            <section className="business-credit-two-column">
              <article className="business-credit-panel">
                <p className="dashboard-eyebrow">
                  Counterparties
                </p>

                <h2>
                  {editingParty
                    ? 'Edit customer / supplier'
                    : 'Add customer / supplier'}
                </h2>

                {editingParty && (
                  <button
                    type="button"
                    className="business-credit-secondary-button"
                    onClick={
                      resetPartyForm
                    }
                  >
                    Cancel edit
                  </button>
                )}

                <form
                  className="business-credit-form"
                  onSubmit={
                    saveParty
                  }
                >
                  <label>
                    Name
                    <input
                      type="text"
                      maxLength={
                        120
                      }
                      value={
                        partyName
                      }
                      onChange={
                        (event) =>
                          setPartyName(
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Role
                    <select
                      value={
                        partyRole
                      }
                      onChange={
                        (event) =>
                          setPartyRole(
                            event
                              .target
                              .value as BusinessPartyRole,
                          )
                      }
                    >
                      <option value="customer">
                        Customer
                      </option>
                      <option value="supplier">
                        Supplier
                      </option>
                      <option value="both">
                        Customer & supplier
                      </option>
                    </select>
                  </label>

                  <label>
                    Phone (optional)
                    <input
                      type="text"
                      maxLength={
                        80
                      }
                      value={
                        partyPhone
                      }
                      onChange={
                        (event) =>
                          setPartyPhone(
                            event
                              .target
                              .value,
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
                        partyNote
                      }
                      onChange={
                        (event) =>
                          setPartyNote(
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                  <button type="submit">
                    {editingParty
                      ? 'Update customer / supplier'
                      : 'Save customer / supplier'}
                  </button>
                </form>

                <div className="business-credit-party-list">
                  {parties.length ===
                  0 ? (
                    <div className="business-credit-inline-empty">
                      No customers or suppliers yet.
                    </div>
                  ) : (
                    parties.map(
                      (party) => (
                        <div
                          key={
                            party.id
                          }
                          className="business-credit-party-row"
                        >
                          <div>
                            <strong>
                              {party.name}
                            </strong>

                            <span>
                              {roleLabel(
                                party.role,
                              )}
                              {party.phone
                                ? ` · ${party.phone}`
                                : ''}
                            </span>
                          </div>

                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                startPartyEdit(
                                  party,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="danger"
                              onClick={() =>
                                void removeParty(
                                  party,
                                )
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ),
                    )
                  )}
                </div>
              </article>

              <article className="business-credit-panel">
                <p className="dashboard-eyebrow">
                  Receivables and payables
                </p>

                <h2>
                  {editingOpenItem
                    ? 'Edit credit record'
                    : 'Add credit record'}
                </h2>

                {editingOpenItem && (
                  <button
                    type="button"
                    className="business-credit-secondary-button"
                    onClick={
                      resetOpenItemForm
                    }
                  >
                    Cancel edit
                  </button>
                )}

                <form
                  className="business-credit-form"
                  onSubmit={
                    saveOpenItem
                  }
                >
                  <div className="business-credit-direction-toggle">
                    <button
                      type="button"
                      className={
                        direction ===
                        'receivable'
                          ? 'selected'
                          : ''
                      }
                      aria-pressed={
                        direction ===
                        'receivable'
                      }
                      onClick={() =>
                        changeDirection(
                          'receivable',
                        )
                      }
                    >
                      Receivable
                    </button>

                    <button
                      type="button"
                      className={
                        direction ===
                        'payable'
                          ? 'selected'
                          : ''
                      }
                      aria-pressed={
                        direction ===
                        'payable'
                      }
                      onClick={() =>
                        changeDirection(
                          'payable',
                        )
                      }
                    >
                      Payable
                    </button>
                  </div>

                  <label>
                    {direction ===
                    'receivable'
                      ? 'Customer'
                      : 'Supplier'}
                    <select
                      value={
                        partyId
                      }
                      onChange={
                        (event) =>
                          setPartyId(
                            event
                              .target
                              .value,
                          )
                      }
                    >
                      <option value="">
                        Choose
                      </option>

                      {eligibleParties.map(
                        (party) => (
                          <option
                            key={
                              party.id
                            }
                            value={
                              party.id
                            }
                          >
                            {party.name}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  {eligibleParties.length ===
                    0 && (
                    <div className="business-credit-form-note">
                      Add an eligible{' '}
                      {direction ===
                      'receivable'
                        ? 'customer'
                        : 'supplier'}{' '}
                      first.
                    </div>
                  )}

                  <label>
                    Original amount (Nu.)
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={
                        amount
                      }
                      onChange={
                        (event) =>
                          setAmount(
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Outstanding amount (Nu.)
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="Defaults to original amount"
                      value={
                        outstandingAmount
                      }
                      onChange={
                        (event) =>
                          setOutstandingAmount(
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Record date
                    <input
                      type="date"
                      value={
                        itemDate
                      }
                      onChange={
                        (event) =>
                          setItemDate(
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Due date (optional)
                    <input
                      type="date"
                      value={
                        dueDate
                      }
                      onChange={
                        (event) =>
                          setDueDate(
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Reference (optional)
                    <input
                      type="text"
                      maxLength={
                        160
                      }
                      placeholder="Invoice, bill or note reference"
                      value={
                        reference
                      }
                      onChange={
                        (event) =>
                          setReference(
                            event
                              .target
                              .value,
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
                        itemNote
                      }
                      onChange={
                        (event) =>
                          setItemNote(
                            event
                              .target
                              .value,
                          )
                      }
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={
                      eligibleParties.length ===
                      0
                    }
                  >
                    {editingOpenItem
                      ? 'Update credit record'
                      : 'Save credit record'}
                  </button>
                </form>
              </article>
            </section>

            <section className="business-credit-panel business-credit-ledger">
              <div className="business-credit-ledger-heading">
                <div>
                  <p className="dashboard-eyebrow">
                    Dues ledger
                  </p>

                  <h2>
                    {selectedBusiness?.name ??
                      'Business'}
                  </h2>
                </div>

                <span>
                  {summary.openItemCount}{' '}
                  {summary.openItemCount ===
                  1
                    ? 'open item'
                    : 'open items'}
                </span>
              </div>

              {openItems.length ===
              0 ? (
                <div className="business-credit-inline-empty">
                  No receivables or payables recorded yet.
                </div>
              ) : (
                <div className="business-credit-item-list">
                  {openItems.map(
                    (item) => {
                      const party =
                        partyById.get(
                          item.partyId,
                        )

                      const overdue =
                        item.outstandingAmountChetrum >
                          0 &&
                        Boolean(
                          item.dueDate,
                        ) &&
                        item.dueDate <
                          today

                      const settled =
                        item.outstandingAmountChetrum ===
                        0

                      return (
                        <article
                          key={
                            item.id
                          }
                          className={
                            overdue
                              ? 'business-credit-item-row overdue'
                              : settled
                                ? 'business-credit-item-row settled'
                                : 'business-credit-item-row'
                          }
                        >
                          <div>
                            <strong>
                              {party?.name ??
                                'Unknown party'}
                            </strong>

                            <span>
                              {directionLabel(
                                item.direction,
                              )}
                            </span>

                            <small>
                              {formatScheduleDate(
                                item.date,
                              )}
                              {item.dueDate
                                ? ` · Due ${formatScheduleDate(
                                    item.dueDate,
                                  )}`
                                : ' · No due date'}
                              {item.reference
                                ? ` · ${item.reference}`
                                : ''}
                            </small>
                          </div>

                          <div className="business-credit-item-money">
                            <span>
                              Outstanding
                            </span>

                            <strong
                              className={
                                item.direction ===
                                'receivable' &&
                                !settled
                                  ? 'income-text'
                                  : ''
                              }
                            >
                              {formatNu(
                                item.outstandingAmountChetrum,
                              )}
                            </strong>

                            <small>
                              Original{' '}
                              {formatNu(
                                item.originalAmountChetrum,
                              )}
                            </small>
                          </div>

                          <div className="business-credit-item-status">
                            <span>
                              {settled
                                ? 'Settled'
                                : overdue
                                  ? 'Overdue'
                                  : item.dueDate
                                    ? 'Open'
                                    : 'Open · no due date'}
                            </span>

                            <div>
                              <button
                                type="button"
                                onClick={() =>
                                  startOpenItemEdit(
                                    item,
                                  )
                                }
                              >
                                Edit
                              </button>

                              {!settled && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    void settleOpenItem(
                                      item,
                                    )
                                  }
                                >
                                  Settle
                                </button>
                              )}

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  void removeOpenItem(
                                    item,
                                  )
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    },
                  )}
                </div>
              )}
            </section>

            <section className="business-credit-footer-note">
              <strong>
                What this does not claim
              </strong>

              <span>
                This is a local receivables/payables tracker. It is
                not audited accounting, tax filing, GST/BST filing,
                invoicing software or a bank reconciliation system.
              </span>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default BusinessCreditPage