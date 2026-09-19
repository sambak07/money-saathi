import { describe, expect, it } from 'vitest'
import { neutralizeCsvFormula, transactionsToCsv } from './finance'
import { createTransaction } from './transactions'

// Helper: build a transaction whose note carries the untrusted text under test.
function noteTransaction(note: string, over: Partial<Parameters<typeof createTransaction>[0]> = {}) {
  return createTransaction({ type: 'expense', amountChetrum: 123400, categoryId: 'food', date: '2024-01-15', paymentMethod: 'Cash', note, isRecurring: false, ...over })
}

// Extract the Note column (last field) from the single data row of a one-row export.
function exportedNote(note: string): string {
  const csv = transactionsToCsv([noteTransaction(note)]).replace(/^\ufeff/, '')
  const dataRow = csv.split('\n').slice(1).join('\n')
  // Note is the final column; everything after the 5th comma of the first logical row.
  // Since notes may contain commas/newlines (and be quoted), parse from the right.
  return dataRow
}

describe('neutralizeCsvFormula', () => {
  it('neutralizes a leading = formula', () => {
    expect(neutralizeCsvFormula('=1+1')).toBe("'=1+1")
  })

  it('neutralizes a leading + formula', () => {
    expect(neutralizeCsvFormula('+SUM(A1:A2)')).toBe("'+SUM(A1:A2)")
  })

  it('neutralizes a leading - formula', () => {
    expect(neutralizeCsvFormula('-1+2')).toBe("'-1+2")
  })

  it('neutralizes a leading @ formula', () => {
    expect(neutralizeCsvFormula('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)")
  })

  it('neutralizes a formula hidden behind leading spaces', () => {
    expect(neutralizeCsvFormula('   =1+1')).toBe("'   =1+1")
  })

  it('neutralizes a formula hidden behind a leading tab', () => {
    expect(neutralizeCsvFormula('\t=1+1')).toBe("'\t=1+1")
  })

  it('neutralizes a cell that opens with a tab or carriage return', () => {
    expect(neutralizeCsvFormula('\tHello')).toBe("'\tHello")
    expect(neutralizeCsvFormula('\rHello')).toBe("'\rHello")
  })

  it('leaves ordinary text untouched', () => {
    expect(neutralizeCsvFormula('Grocery shopping')).toBe('Grocery shopping')
  })

  it('leaves text containing commas untouched (quoting is separate)', () => {
    expect(neutralizeCsvFormula('Grocery, family')).toBe('Grocery, family')
  })

  it('leaves an empty string untouched', () => {
    expect(neutralizeCsvFormula('')).toBe('')
  })

  it('does not neutralize a value that merely contains a formula char later', () => {
    expect(neutralizeCsvFormula('Total=100')).toBe('Total=100')
    expect(neutralizeCsvFormula('Bill (2+2)')).toBe('Bill (2+2)')
  })

  it('does not neutralize numeric-looking non-formula values', () => {
    expect(neutralizeCsvFormula('1234.00')).toBe('1234.00')
    expect(neutralizeCsvFormula('2024-01-15')).toBe('2024-01-15')
  })
})

describe('transactionsToCsv formula-injection safety', () => {
  it('does not begin the note cell with an executable formula prefix', () => {
    const row = exportedNote('=1+1 TEST')
    // The exported note cell must start with the single-quote guard, not "=".
    expect(row.includes(",'=1+1 TEST")).toBe(true)
    expect(row.includes(',=1+1 TEST')).toBe(false)
  })

  it('guards +, -, and @ prefixes too', () => {
    expect(exportedNote('+SUM(A1:A2)').includes(",'+SUM(A1:A2)")).toBe(true)
    expect(exportedNote('-1+2').includes(",'-1+2")).toBe(true)
    expect(exportedNote('@SUM(A1:A2)').includes(",'@SUM(A1:A2)")).toBe(true)
  })

  it('keeps ordinary notes readable and unquoted', () => {
    expect(exportedNote('Grocery shopping').endsWith('Grocery shopping')).toBe(true)
  })

  it('quotes notes containing commas without a formula guard', () => {
    expect(exportedNote('Grocery, family').endsWith('"Grocery, family"')).toBe(true)
  })

  it('escapes embedded quotes per CSV rules', () => {
    expect(exportedNote('Say "hi"').endsWith('"Say ""hi"""')).toBe(true)
  })

  it('quotes multiline notes so the file stays valid CSV', () => {
    const csv = transactionsToCsv([noteTransaction('line one\nline two')]).replace(/^\ufeff/, '')
    expect(csv.includes('"line one\nline two"')).toBe(true)
  })

  it('quotes a note that is both a formula and contains a comma', () => {
    // Guard is applied first, then quoting: '=A1,B1  ->  "'=A1,B1"
    expect(exportedNote('=A1,B1').includes(`"'=A1,B1"`)).toBe(true)
  })

  it('never turns the numeric amount column into a guarded/incorrect value', () => {
    const csv = transactionsToCsv([noteTransaction('ordinary', { amountChetrum: 123400 })]).replace(/^\ufeff/, '')
    const dataRow = csv.split('\n')[1]
    const cells = dataRow.split(',')
    // Columns: Date, Type, Category, Amount, Payment Method, Note
    expect(cells[3]).toBe('1234.00')
    expect(cells[3].startsWith("'")).toBe(false)
  })

  it('keeps the header row intact', () => {
    const csv = transactionsToCsv([]).replace(/^\ufeff/, '')
    expect(csv.split('\n')[0]).toBe('Date,Type,Category,Amount,Payment Method,Note')
  })
})
