const ISO_DATE_PATTERN =
  /^\d{4}-\d{2}-\d{2}$/

function isValidIsoDate(
  value: string,
): boolean {
  if (
    !ISO_DATE_PATTERN.test(
      value,
    )
  ) {
    return false
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split('-')
      .map(Number)

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
      ),
    )

  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  )
}

function daysInUtcMonth(
  year: number,
  monthIndex: number,
): number {
  return new Date(
    Date.UTC(
      year,
      monthIndex + 1,
      0,
    ),
  ).getUTCDate()
}

export function addMonthsClampedIso(
  startDate: string,
  months: number,
): string {
  if (
    !isValidIsoDate(
      startDate,
    )
  ) {
    throw new Error(
      'Deposit start date must use a valid YYYY-MM-DD date.',
    )
  }

  if (
    !Number.isSafeInteger(
      months,
    ) ||
    months < 1 ||
    months > 1200
  ) {
    throw new Error(
      'Deposit tenure must be between 1 and 1200 months.',
    )
  }

  const [
    year,
    month,
    day,
  ] =
    startDate
      .split('-')
      .map(Number)

  const targetMonthIndex =
    month - 1 + months

  const targetYear =
    year +
    Math.floor(
      targetMonthIndex /
        12,
    )

  const targetMonth =
    (
      (
        targetMonthIndex %
        12
      ) +
      12
    ) %
    12

  const targetDay =
    Math.min(
      day,
      daysInUtcMonth(
        targetYear,
        targetMonth,
      ),
    )

  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      targetDay,
    ),
  )
    .toISOString()
    .slice(
      0,
      10,
    )
}