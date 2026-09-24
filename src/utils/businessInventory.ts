import type {
  BusinessInventoryItem,
  BusinessTradeLine,
} from '../types/business'

const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

function assertNonNegativeSafeInteger(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value < 0
  ) {
    throw new Error(
      `${label} must be a non-negative safe integer.`,
    )
  }
}

function assertPositiveSafeInteger(
  value: number,
  label: string,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value <= 0
  ) {
    throw new Error(
      `${label} must be a positive safe integer.`,
    )
  }
}

function toSafeNumber(
  value: bigint,
  label: string,
): number {
  if (
    value >
      MAX_SAFE ||
    value <
      -MAX_SAFE
  ) {
    throw new Error(
      `${label} exceeds the supported numeric range.`,
    )
  }

  return Number(
    value,
  )
}

function multiplyQuantityByUnitCost(
  quantityMilliUnits: number,
  unitCostChetrum: number,
): number {
  assertNonNegativeSafeInteger(
    quantityMilliUnits,
    'Inventory quantity',
  )

  assertNonNegativeSafeInteger(
    unitCostChetrum,
    'Inventory unit cost',
  )

  const numerator =
    BigInt(
      quantityMilliUnits,
    ) *
    BigInt(
      unitCostChetrum,
    )

  const rounded =
    (
      numerator +
      500n
    ) /
    1000n

  return toSafeNumber(
    rounded,
    'Inventory value',
  )
}

export interface BusinessInventoryPosition {
  inventoryItemId: string
  name: string
  unit: string
  quantityMilliUnits: number
  recordedUnitCostChetrum: number
  estimatedStockValueChetrum: number
  belowLowStockLevel: boolean
  negativeQuantity: boolean
}

export interface BusinessInventorySummary {
  items: BusinessInventoryPosition[]
  estimatedStockValueChetrum: number
  costOfGoodsSoldChetrum: number
  salesLineAmountChetrum: number
  grossMarginBeforeOtherBusinessExpensesChetrum: number
  negativeStockItemCount: number
  lowStockItemCount: number
}

export function summarizeBusinessInventory(
  inventoryItems: BusinessInventoryItem[],
  tradeLines: BusinessTradeLine[],
): BusinessInventorySummary {
  const itemById =
    new Map(
      inventoryItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    )

  const quantityByItem =
    new Map<string, bigint>()

  let cogs = 0n
  let salesLineAmount = 0n

  for (
    const item of inventoryItems
  ) {
    assertNonNegativeSafeInteger(
      item.openingQuantityMilliUnits,
      'Opening inventory quantity',
    )

    assertNonNegativeSafeInteger(
      item.currentUnitCostChetrum,
      'Recorded inventory unit cost',
    )

    assertNonNegativeSafeInteger(
      item.lowStockQuantityMilliUnits,
      'Low stock quantity',
    )

    quantityByItem.set(
      item.id,
      BigInt(
        item.openingQuantityMilliUnits,
      ),
    )
  }

  for (
    const line of tradeLines
  ) {
    assertPositiveSafeInteger(
      line.quantityMilliUnits,
      'Business trade line quantity',
    )

    assertPositiveSafeInteger(
      line.lineAmountChetrum,
      'Business trade line amount',
    )

    assertNonNegativeSafeInteger(
      line.costOfGoodsSoldChetrum,
      'Business trade line cost of goods sold',
    )

    if (
      line.kind ===
        'purchase' &&
      line.costOfGoodsSoldChetrum !==
        0
    ) {
      throw new Error(
        'Purchase trade lines cannot record cost of goods sold.',
      )
    }

    const item =
      itemById.get(
        line.inventoryItemId,
      )

    if (!item) {
      throw new Error(
        'Business trade line references an unknown inventory item.',
      )
    }

    if (
      line.businessId !==
      item.businessId
    ) {
      throw new Error(
        'Business trade line and inventory item belong to different businesses.',
      )
    }

    const current =
      quantityByItem.get(
        item.id,
      ) ??
      0n

    const quantity =
      BigInt(
        line.quantityMilliUnits,
      )

    quantityByItem.set(
      item.id,
      line.kind ===
        'purchase'
        ? current +
            quantity
        : current -
            quantity,
    )

    if (
      line.kind ===
      'sale'
    ) {
      salesLineAmount +=
        BigInt(
          line.lineAmountChetrum,
        )

      cogs +=
        BigInt(
          line.costOfGoodsSoldChetrum,
        )

      if (
        salesLineAmount >
          MAX_SAFE ||
        cogs >
          MAX_SAFE
      ) {
        throw new Error(
          'Business inventory totals exceed the supported money range.',
        )
      }
    }
  }

  let estimatedStockValue =
    0n

  let negativeStockItemCount =
    0

  let lowStockItemCount =
    0

  const items =
    inventoryItems.map(
      (item) => {
        const quantityBig =
          quantityByItem.get(
            item.id,
          ) ??
          0n

        const quantity =
          toSafeNumber(
            quantityBig,
            'Inventory quantity',
          )

        const negativeQuantity =
          quantity <
          0

        if (
          negativeQuantity
        ) {
          negativeStockItemCount +=
            1
        }

        const belowLowStockLevel =
          item.active &&
          quantity <=
            item.lowStockQuantityMilliUnits

        if (
          belowLowStockLevel
        ) {
          lowStockItemCount +=
            1
        }

        const estimatedStockValueChetrum =
          negativeQuantity
            ? 0
            : multiplyQuantityByUnitCost(
                quantity,
                item.currentUnitCostChetrum,
              )

        estimatedStockValue +=
          BigInt(
            estimatedStockValueChetrum,
          )

        if (
          estimatedStockValue >
          MAX_SAFE
        ) {
          throw new Error(
            'Estimated stock value exceeds the supported money range.',
          )
        }

        return {
          inventoryItemId:
            item.id,
          name:
            item.name,
          unit:
            item.unit,
          quantityMilliUnits:
            quantity,
          recordedUnitCostChetrum:
            item.currentUnitCostChetrum,
          estimatedStockValueChetrum,
          belowLowStockLevel,
          negativeQuantity,
        }
      },
    )

  return {
    items,
    estimatedStockValueChetrum:
      Number(
        estimatedStockValue,
      ),
    costOfGoodsSoldChetrum:
      Number(
        cogs,
      ),
    salesLineAmountChetrum:
      Number(
        salesLineAmount,
      ),
    grossMarginBeforeOtherBusinessExpensesChetrum:
      toSafeNumber(
        salesLineAmount -
          cogs,
        'Gross margin before other business expenses',
      ),
    negativeStockItemCount,
    lowStockItemCount,
  }
}