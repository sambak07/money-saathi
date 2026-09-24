const MAX_SAFE =
  BigInt(
    Number.MAX_SAFE_INTEGER,
  )

function assertChetrum(
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

function exactBigIntToNumber(
  value: bigint,
  label: string,
): number {
  if (
    value > MAX_SAFE ||
    value < -MAX_SAFE
  ) {
    throw new Error(
      `${label} exceeds the supported money range.`,
    )
  }

  return Number(
    value,
  )
}

export function addChetrumExact(
  left: number,
  right: number,
  label = 'Money total',
): number {
  assertChetrum(
    left,
    label,
  )
  assertChetrum(
    right,
    label,
  )

  return exactBigIntToNumber(
    BigInt(left) +
      BigInt(right),
    label,
  )
}

export function sumChetrumExact(
  values: Iterable<number>,
  label = 'Money total',
): number {
  let total = 0n

  for (const value of values) {
    assertChetrum(
      value,
      label,
    )

    total +=
      BigInt(
        value,
      )

    if (total > MAX_SAFE) {
      throw new Error(
        `${label} exceeds the supported money range.`,
      )
    }
  }

  return Number(
    total,
  )
}

export function subtractChetrumExact(
  left: number,
  right: number,
  label = 'Money difference',
): number {
  assertChetrum(
    left,
    label,
  )
  assertChetrum(
    right,
    label,
  )

  return exactBigIntToNumber(
    BigInt(left) -
      BigInt(right),
    label,
  )
}