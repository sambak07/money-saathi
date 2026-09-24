import {
  type FormEvent,
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
  getBusinessProfiles,
  getBusinessTradeLines,
  upsertBusinessInventoryItem,
} from '../storage/db'
import type {
  BusinessInventoryItem,
  BusinessProfile,
  BusinessTradeLine,
} from '../types/business'
import {
  summarizeBusinessInventory,
} from '../utils/businessInventory'
import {
  formatBusinessQuantity,
  parseBusinessQuantityToMilliUnits,
} from '../utils/businessQuantity'
import {
  formatChetrumForInput,
  formatNu,
} from '../utils/money'
import {
  parseNuInputToChetrum,
} from '../utils/safeToSpend'

import '../styles/business-inventory.css'

function BusinessInventoryPage() {
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

  const [
    tradeLines,
    setTradeLines,
  ] =
    useState<BusinessTradeLine[]>([])

  const [
    editingItem,
    setEditingItem,
  ] =
    useState<BusinessInventoryItem | null>(
      null,
    )

  const [name, setName] =
    useState('')

  const [sku, setSku] =
    useState('')

  const [unit, setUnit] =
    useState('piece')

  const [
    openingQuantity,
    setOpeningQuantity,
  ] =
    useState('')

  const [
    unitCost,
    setUnitCost,
  ] =
    useState('')

  const [
    lowStockQuantity,
    setLowStockQuantity,
  ] =
    useState('')

  const [note, setNote] =
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

  const summary =
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

  function resetForm() {
    setEditingItem(null)
    setName('')
    setSku('')
    setUnit('piece')
    setOpeningQuantity('')
    setUnitCost('')
    setLowStockQuantity('')
    setNote('')
  }

  async function loadWorkspace(
    businessId: string,
  ) {
    const [
      nextInventoryItems,
      nextTradeLines,
    ] =
      await Promise.all([
        getBusinessInventoryItems(
          businessId,
        ),
        getBusinessTradeLines(
          businessId,
        ),
      ])

    setInventoryItems(
      nextInventoryItems,
    )

    setTradeLines(
      nextTradeLines,
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
          nextInventoryItems,
          nextTradeLines,
        ] =
          await Promise.all([
            getBusinessInventoryItems(
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

        setTradeLines(
          nextTradeLines,
        )
      } catch {
        if (active) {
          setError(
            'Money Saathi could not load business inventory.',
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

  function startEdit(
    item: BusinessInventoryItem,
  ) {
    setEditingItem(
      item,
    )

    setName(
      item.name,
    )

    setSku(
      item.sku,
    )

    setUnit(
      item.unit,
    )

    setOpeningQuantity(
      formatBusinessQuantity(
        item.openingQuantityMilliUnits,
      ),
    )

    setUnitCost(
      formatChetrumForInput(
        item.currentUnitCostChetrum,
      ),
    )

    setLowStockQuantity(
      formatBusinessQuantity(
        item.lowStockQuantityMilliUnits,
      ),
    )

    setNote(
      item.note,
    )

    setMessage('')
    setError('')
  }

  async function saveItem(
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

    const cleanName =
      name.trim()

    const cleanUnit =
      unit.trim()

    if (
      cleanName.length <
      2
    ) {
      setError(
        'Enter a clear stock item name.',
      )
      return
    }

    if (!cleanUnit) {
      setError(
        'Enter a unit such as piece, litre or kg.',
      )
      return
    }

    const openingQuantityMilliUnits =
      parseBusinessQuantityToMilliUnits(
        openingQuantity || '0',
      )

    const lowStockQuantityMilliUnits =
      parseBusinessQuantityToMilliUnits(
        lowStockQuantity || '0',
      )

    const currentUnitCostChetrum =
      parseNuInputToChetrum(
        unitCost || '0',
      )

    if (
      openingQuantityMilliUnits ===
        null ||
      lowStockQuantityMilliUnits ===
        null
    ) {
      setError(
        'Enter quantities with up to three decimal places.',
      )
      return
    }

    if (
      currentUnitCostChetrum ===
      null
    ) {
      setError(
        'Enter a valid recorded unit cost.',
      )
      return
    }

    const duplicate =
      inventoryItems.some(
        (item) =>
          item.id !==
            editingItem?.id &&
          item.name
            .trim()
            .toLocaleLowerCase() ===
            cleanName.toLocaleLowerCase(),
      )

    if (duplicate) {
      setError(
        'An inventory item with this name already exists in this business.',
      )
      return
    }

    const now =
      Date.now()

    const record:
      BusinessInventoryItem = {
        id:
          editingItem?.id ??
          crypto.randomUUID(),
        businessId:
          selectedBusiness.id,
        name:
          cleanName,
        sku:
          sku.trim(),
        unit:
          cleanUnit,
        openingQuantityMilliUnits,
        currentUnitCostChetrum,
        lowStockQuantityMilliUnits,
        active:
          editingItem?.active ??
          true,
        note:
          note.trim(),
        createdAt:
          editingItem?.createdAt ??
          now,
        updatedAt:
          now,
      }

    try {
      const wasEditing =
        editingItem !==
        null

      await upsertBusinessInventoryItem(
        record,
      )

      await loadWorkspace(
        selectedBusiness.id,
      )

      resetForm()

      setMessage(
        wasEditing
          ? 'Inventory item updated.'
          : 'Inventory item added.',
      )
    } catch {
      setError(
        'Money Saathi could not save this inventory item.',
      )
    }
  }

  async function toggleActive(
    item: BusinessInventoryItem,
  ) {
    setMessage('')
    setError('')

    try {
      await upsertBusinessInventoryItem({
        ...item,
        active:
          !item.active,
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

      if (
        editingItem?.id ===
        item.id
      ) {
        resetForm()
      }

      setMessage(
        item.active
          ? 'Inventory item archived. Historical stock records remain.'
          : 'Inventory item reactivated.',
      )
    } catch {
      setError(
        'Money Saathi could not update this inventory item.',
      )
    }
  }

  return (
    <AppShell>
      <div className="dashboard-container business-inventory-page">
        <header className="business-inventory-header">
          <div>
            <p className="dashboard-eyebrow">
              Business 2.0
            </p>

            <h1>
              Inventory
            </h1>

            <p>
              Keep a local stock master and see quantities derived
              from opening stock, purchases and sales.
            </p>
          </div>

          <div className="business-inventory-header-actions">
            <Link to="/app/business/credit">
              Customers & dues
            </Link>

            <Link to="/app/business">
              Business cash
            </Link>
          </div>
        </header>

        {message && (
          <div
            className="business-inventory-message"
            role="status"
          >
            {message}
          </div>
        )}

        {error && (
          <div
            className="business-inventory-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {businesses.length ===
        0 ? (
          <section className="business-inventory-empty">
            <strong>
              Create a Business workspace first.
            </strong>

            <p>
              Inventory belongs to a specific business and stays
              outside your personal money.
            </p>

            <Link to="/app/business">
              Open Business
            </Link>
          </section>
        ) : (
          <>
            <section className="business-inventory-selector">
              <label htmlFor="business-inventory-select">
                Current business
              </label>

              <select
                id="business-inventory-select"
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
              className="business-inventory-summary-grid"
              aria-label="Inventory summary"
            >
              <article>
                <span>
                  Stock items
                </span>

                <strong>
                  {
                    summary.items
                      .length
                  }
                </strong>

                <small>
                  Active and archived records.
                </small>
              </article>

              <article>
                <span>
                  Estimated stock value
                </span>

                <strong>
                  {formatNu(
                    summary.estimatedStockValueChetrum,
                  )}
                </strong>

                <small>
                  Current quantity × recorded current unit cost.
                </small>
              </article>

              <article>
                <span>
                  Low stock
                </span>

                <strong>
                  {
                    summary.lowStockItemCount
                  }
                </strong>

                <small>
                  Active items at or below their low-stock level.
                </small>
              </article>

              <article>
                <span>
                  Negative stock
                </span>

                <strong>
                  {
                    summary.negativeStockItemCount
                  }
                </strong>

                <small>
                  Review missing purchases, opening stock or sale quantities.
                </small>
              </article>
            </section>

            <section className="business-inventory-boundary">
              <strong>
                Stock value is an estimate, not cash or profit.
              </strong>

              <span>
                Money Saathi uses the recorded current unit cost for
                the stock-value estimate. Sale COGS remains a separate
                recorded amount and is not invented from selling price.
              </span>
            </section>

            <section className="business-inventory-layout">
              <article className="business-inventory-panel">
                <p className="dashboard-eyebrow">
                  Stock master
                </p>

                <h2>
                  {editingItem
                    ? 'Edit inventory item'
                    : 'Add inventory item'}
                </h2>

                {editingItem && (
                  <button
                    type="button"
                    className="business-inventory-secondary-button"
                    onClick={
                      resetForm
                    }
                  >
                    Cancel edit
                  </button>
                )}

                <form
                  className="business-inventory-form"
                  onSubmit={
                    saveItem
                  }
                >
                  <label>
                    Item name
                    <input
                      type="text"
                      maxLength={
                        120
                      }
                      value={
                        name
                      }
                      onChange={
                        (event) =>
                          setName(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <label>
                    SKU / code (optional)
                    <input
                      type="text"
                      maxLength={
                        80
                      }
                      value={
                        sku
                      }
                      onChange={
                        (event) =>
                          setSku(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Unit
                    <input
                      type="text"
                      maxLength={
                        40
                      }
                      placeholder="piece, litre, kg..."
                      value={
                        unit
                      }
                      onChange={
                        (event) =>
                          setUnit(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Opening quantity
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={
                        openingQuantity
                      }
                      onChange={
                        (event) =>
                          setOpeningQuantity(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Recorded current unit cost (Nu.)
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={
                        unitCost
                      }
                      onChange={
                        (event) =>
                          setUnitCost(
                            event.target.value,
                          )
                      }
                    />
                  </label>

                  <label>
                    Low-stock level
                    <input
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0"
                      value={
                        lowStockQuantity
                      }
                      onChange={
                        (event) =>
                          setLowStockQuantity(
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

                  <button type="submit">
                    {editingItem
                      ? 'Update inventory item'
                      : 'Save inventory item'}
                  </button>
                </form>
              </article>

              <article className="business-inventory-panel">
                <div className="business-inventory-panel-heading">
                  <div>
                    <p className="dashboard-eyebrow">
                      Current stock
                    </p>

                    <h2>
                      {selectedBusiness?.name ??
                        'Business'}
                    </h2>
                  </div>

                  <span>
                    Derived locally
                  </span>
                </div>

                {summary.items.length ===
                0 ? (
                  <div className="business-inventory-inline-empty">
                    No inventory items yet.
                  </div>
                ) : (
                  <div className="business-inventory-list">
                    {summary.items.map(
                      (position) => {
                        const item =
                          inventoryItems.find(
                            (record) =>
                              record.id ===
                              position.inventoryItemId,
                          )

                        if (!item) {
                          return null
                        }

                        return (
                          <article
                            key={
                              item.id
                            }
                            className={
                              position.negativeQuantity
                                ? 'business-inventory-row negative'
                                : position.belowLowStockLevel
                                  ? 'business-inventory-row low'
                                  : 'business-inventory-row'
                            }
                          >
                            <div>
                              <strong>
                                {item.name}
                              </strong>

                              <span>
                                {item.sku
                                  ? `${item.sku} · `
                                  : ''}
                                {item.active
                                  ? 'Active'
                                  : 'Archived'}
                              </span>

                              <small>
                                {position.negativeQuantity
                                  ? 'Negative stock — review records'
                                  : position.belowLowStockLevel
                                    ? 'At or below low-stock level'
                                    : 'Stock level recorded'}
                              </small>
                            </div>

                            <div className="business-inventory-row-quantity">
                              <span>
                                Quantity
                              </span>

                              <strong>
                                {formatBusinessQuantity(
                                  position.quantityMilliUnits,
                                )}{' '}
                                {item.unit}
                              </strong>

                              <small>
                                Low level{' '}
                                {formatBusinessQuantity(
                                  item.lowStockQuantityMilliUnits,
                                )}
                              </small>
                            </div>

                            <div className="business-inventory-row-value">
                              <span>
                                Estimated value
                              </span>

                              <strong>
                                {formatNu(
                                  position.estimatedStockValueChetrum,
                                )}
                              </strong>

                              <small>
                                Unit cost{' '}
                                {formatNu(
                                  item.currentUnitCostChetrum,
                                )}
                              </small>
                            </div>

                            <div className="business-inventory-row-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(
                                    item,
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void toggleActive(
                                    item,
                                  )
                                }
                              >
                                {item.active
                                  ? 'Archive'
                                  : 'Reactivate'}
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

            <section className="business-inventory-footer-note">
              <strong>
                Current scope
              </strong>

              <span>
                Inventory quantities are derived from opening stock
                plus recorded purchase lines minus recorded sale lines.
                The sales/purchase register UI is the next stage.
                Archiving an item never deletes its historical records.
              </span>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default BusinessInventoryPage