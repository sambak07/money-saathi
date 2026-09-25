import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  parseTransactionMessage,
} from './transactionMessage'

describe('transaction message parser', () => {
  it('parses a debit alert with amount and day-first date', () => {
    expect(
      parseTransactionMessage(
        'Your account has been debited by Nu. 1,250.00 on 25/09/2026.',
      ),
    ).toEqual({
      amountChetrum: 125000,
      date: '2026-09-25',
      direction: 'expense',
    })
  })

  it('parses a credit alert without treating its balance as the transaction amount', () => {
    expect(
      parseTransactionMessage(
        'Nu. 25,000 credited to your account on 25-Sep-2026. Avl Bal: Nu. 84,500.00',
      ),
    ).toEqual({
      amountChetrum: 2500000,
      date: '2026-09-25',
      direction: 'income',
    })
  })

  it('supports BTN amounts and ISO dates', () => {
    expect(
      parseTransactionMessage(
        'BTN 650 paid on 2026-09-24.',
      ),
    ).toEqual({
      amountChetrum: 65000,
      date: '2026-09-24',
      direction: 'expense',
    })
  })

  it('does not treat an unmarked account number as money', () => {
    expect(
      parseTransactionMessage(
        'Account 123456789 was debited on 25/09/2026.',
      ),
    ).toEqual({
      amountChetrum: null,
      date: '2026-09-25',
      direction: 'expense',
    })
  })

  it('returns unknown when both incoming and outgoing wording are present', () => {
    expect(
      parseTransactionMessage(
        'Nu. 500 received and then sent on 25/09/2026.',
      ).direction,
    ).toBe('unknown')
  })

  it('rejects an impossible calendar date', () => {
    expect(
      parseTransactionMessage(
        'Nu. 500 debited on 31/02/2026.',
      ).date,
    ).toBeNull()
  })

  it('does not guess between multiple unlabelled currency amounts without direction context', () => {
    expect(
      parseTransactionMessage(
        'Nu. 500 and Nu. 600 are shown in this message.',
      ).amountChetrum,
    ).toBeNull()
  })
})
