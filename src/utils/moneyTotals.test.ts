import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  addChetrumExact,
  subtractChetrumExact,
  sumChetrumExact,
} from './moneyTotals'

describe('checked aggregate money arithmetic', () => {
  it('adds ordinary chetrum values exactly', () => {
    expect(
      sumChetrumExact(
        [
          100,
          250,
          650,
        ],
      ),
    ).toBe(1_000)

    expect(
      addChetrumExact(
        100,
        250,
      ),
    ).toBe(350)
  })

  it('supports exact positive and negative differences', () => {
    expect(
      subtractChetrumExact(
        1_000,
        250,
      ),
    ).toBe(750)

    expect(
      subtractChetrumExact(
        250,
        1_000,
      ),
    ).toBe(-750)
  })

  it('rejects totals outside JavaScript safe integer range', () => {
    expect(
      () =>
        sumChetrumExact([
          Number.MAX_SAFE_INTEGER,
          1,
        ]),
    ).toThrow(
      'supported money range',
    )
  })
})