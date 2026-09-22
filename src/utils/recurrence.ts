import type {
  RegularFrequency,
  RegularMoney,
} from '../types/regularMoney'

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function occurrenceAtIndex(
  startDate: string,
  frequency: RegularFrequency,
  index: number,
): string {
  const anchor = parseLocalDate(startDate)

  if (frequency === 'weekly') {
    const date = new Date(anchor)
    date.setDate(anchor.getDate() + index * 7)
    return formatLocalDate(date)
  }

  if (frequency === 'monthly') {
    const targetMonthIndex = anchor.getMonth() + index
    const year =
      anchor.getFullYear() + Math.floor(targetMonthIndex / 12)
    const month = ((targetMonthIndex % 12) + 12) % 12
    const day = Math.min(
      anchor.getDate(),
      daysInMonth(year, month),
    )

    return formatLocalDate(new Date(year, month, day))
  }

  const year = anchor.getFullYear() + index
  const month = anchor.getMonth()
  const day = Math.min(
    anchor.getDate(),
    daysInMonth(year, month),
  )

  return formatLocalDate(new Date(year, month, day))
}

export function generateOccurrencesBetween(
  item: RegularMoney,
  fromDate: string,
  toDate: string,
): string[] {
  if (
    !fromDate ||
    !toDate ||
    toDate < fromDate ||
    toDate < item.startDate
  ) {
    return []
  }

  const effectiveEnd =
    item.endDate && item.endDate < toDate
      ? item.endDate
      : toDate

  const occurrences: string[] = []

  for (let index = 0; index < 5000; index += 1) {
    const occurrence = occurrenceAtIndex(
      item.startDate,
      item.frequency,
      index,
    )

    if (occurrence > effectiveEnd) break

    if (occurrence >= fromDate && occurrence >= item.startDate) {
      occurrences.push(occurrence)
    }
  }

  return occurrences
}

export function getNextOccurrence(
  item: RegularMoney,
  afterDate: string,
): string | null {
  for (let index = 0; index < 5000; index += 1) {
    const occurrence = occurrenceAtIndex(
      item.startDate,
      item.frequency,
      index,
    )

    if (item.endDate && occurrence > item.endDate) {
      return null
    }

    if (occurrence > afterDate) {
      return occurrence
    }
  }

  return null
}

export function getMonthBounds(
  month: string,
): { start: string; end: string } {
  const [year, monthNumber] = month.split('-').map(Number)
  const finalDay = new Date(year, monthNumber, 0).getDate()

  return {
    start: `${month}-01`,
    end: `${month}-${String(finalDay).padStart(2, '0')}`,
  }
}

export function formatScheduleDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseLocalDate(value))
}

export function getFrequencyLabel(
  frequency: RegularFrequency,
): string {
  if (frequency === 'weekly') return 'Weekly'
  if (frequency === 'monthly') return 'Monthly'
  return 'Yearly'
}
