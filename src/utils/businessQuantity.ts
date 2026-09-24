const QUANTITY_PATTERN =
  /^\d+(?:\.\d{1,3})?$/

export function parseBusinessQuantityToMilliUnits(
  raw: string,
): number | null {
  const value =
    raw.trim()

  if (
    !QUANTITY_PATTERN.test(
      value,
    )
  ) {
    return null
  }

  const [
    whole,
    fraction = '',
  ] =
    value.split('.')

  const normalizedFraction =
    fraction.padEnd(
      3,
      '0',
    )

  const result =
    BigInt(
      whole,
    ) *
      1000n +
    BigInt(
      normalizedFraction,
    )

  if (
    result >
    BigInt(
      Number.MAX_SAFE_INTEGER,
    )
  ) {
    return null
  }

  return Number(
    result,
  )
}

export function formatBusinessQuantity(
  milliUnits: number,
): string {
  if (
    !Number.isSafeInteger(
      milliUnits,
    )
  ) {
    throw new Error(
      'Business quantity must be a safe integer.',
    )
  }

  const sign =
    milliUnits < 0
      ? '-'
      : ''

  const absolute =
    Math.abs(
      milliUnits,
    )

  const whole =
    Math.floor(
      absolute /
      1000,
    )

  const fraction =
    String(
      absolute %
      1000,
    )
      .padStart(
        3,
        '0',
      )
      .replace(
        /0+$/,
        '',
      )

  return fraction
    ? `${sign}${whole}.${fraction}`
    : `${sign}${whole}`
}