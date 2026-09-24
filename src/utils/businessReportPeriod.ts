const MONTH_PATTERN =
  /^\d{4}-\d{2}$/

export interface BusinessMonthRange {
  startDate: string
  endDate: string
}

function daysInMonth(
  year: number,
  month: number,
): number {
  return new Date(
    Date.UTC(
      year,
      month,
      0,
    ),
  ).getUTCDate()
}

export function getBusinessMonthRange(
  monthValue: string,
  today: string,
): BusinessMonthRange {
  if (
    !MONTH_PATTERN.test(
      monthValue,
    )
  ) {
    throw new Error(
      'Business report month must use YYYY-MM.',
    )
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      today,
    )
  ) {
    throw new Error(
      'Business report current date must use YYYY-MM-DD.',
    )
  }

  const [
    yearText,
    monthText,
  ] =
    monthValue.split('-')

  const year =
    Number(
      yearText,
    )

  const month =
    Number(
      monthText,
    )

  if (
    !Number.isInteger(
      year,
    ) ||
    !Number.isInteger(
      month,
    ) ||
    month <
      1 ||
    month >
      12
  ) {
    throw new Error(
      'Business report month is invalid.',
    )
  }

  const currentMonth =
    today.slice(
      0,
      7,
    )

  if (
    monthValue >
    currentMonth
  ) {
    throw new Error(
      'Business reports cannot use a future month.',
    )
  }

  return {
    startDate:
      `${monthValue}-01`,
    endDate:
      monthValue ===
        currentMonth
        ? today
        : `${monthValue}-${String(
            daysInMonth(
              year,
              month,
            ),
          ).padStart(
            2,
            '0',
          )}`,
  }
}