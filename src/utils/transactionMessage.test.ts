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

  it('keeps the debit amount when a later available balance is nearby', () => {
    expect(
      parseTransactionMessage(
        'A/c XX1234 debited with Nu. 1,250.00. Avl Bal: Nu. 84,500.00 on 25/09/2026.',
      ),
    ).toEqual({
      amountChetrum: 125000,
      date: '2026-09-25',
      direction: 'expense',
    })
  })

  it('does not treat a balance-only alert as a transaction amount', () => {
    expect(
      parseTransactionMessage(
        'Available Balance: Nu. 84,500.00 as on 25/09/2026.',
      ).amountChetrum,
    ).toBeNull()
  })

  it('parses a QR payment received alert as money in', () => {
    expect(
      parseTransactionMessage(
        'QR payment received: Nu. 3,500.00 on 25/09/26. Ref 987654321.',
      ),
    ).toEqual({
      amountChetrum: 350000,
      date: '2026-09-25',
      direction: 'income',
    })
  })

  it('parses a QR payment made alert as money out', () => {
    expect(
      parseTransactionMessage(
        'Payment made: BTN 650.00 via QR on 25-09-26.',
      ),
    ).toEqual({
      amountChetrum: 65000,
      date: '2026-09-25',
      direction: 'expense',
    })
  })

  it('keeps generic successful payment wording direction-neutral', () => {
    expect(
      parseTransactionMessage(
        'Transaction successful for Nu. 500.00 on 25/09/26.',
      ),
    ).toEqual({
      amountChetrum: 50000,
      date: '2026-09-25',
      direction: 'unknown',
    })
  })

  it('supports named month dates with a two-digit year', () => {
    expect(
      parseTransactionMessage(
        'Nu. 2,000 credited on 25 Sep 26.',
      ).date,
    ).toBe('2026-09-25')
  })

  it('parses real-style BTN-dot debit alert and ignores total available balance', () => {
    expect(
      parseTransactionMessage(
        'Dear Customer, Your Account XXXXXXXX1003 has been Debited with BTN. 325.00 on 03-09-2026 10:03:21 thru Internet Bkg. Total Aval Bal is BTN.2186.35 CR.',
      ),
    ).toEqual({
      amountChetrum: 32500,
      date: '2026-09-03',
      direction: 'expense',
    })
  })

  it('parses real-style debit alert and ignores AC BALANCE IS amount', () => {
    expect(
      parseTransactionMessage(
        'DEAR CUSTOMER, YOUR A/C 20XXXXX28 HAS BEEN DEBITED BY BTN 2,000.00 WITH REF : 126-771514503. ON 19/09/2026 AT 03:32 AM. AC BALANCE IS BTN 17,757.07.',
      ),
    ).toEqual({
      amountChetrum: 200000,
      date: '2026-09-19',
      direction: 'expense',
    })
  })

  it('parses real-style debit alert with AC balance wording', () => {
    expect(
      parseTransactionMessage(
        'Dear Customer, your XXXXX4441 has been Debited by BTN 175.00 with ref:262271218 on 15-08-2026 at 05:35 PM. AC balance is BTN 900.95.',
      ),
    ).toEqual({
      amountChetrum: 17500,
      date: '2026-08-15',
      direction: 'expense',
    })
  })

  it('parses real-style credit alert and ignores Acc balance is amount', () => {
    expect(
      parseTransactionMessage(
        'Dear Customer, Nu. 15,000.00 is Credited to your a/c 77XXXXX31 on 19-09-2026 at 11:13:14 AM. Acc balance is Nu. 15,881.75',
      ),
    ).toEqual({
      amountChetrum: 1500000,
      date: '2026-09-19',
      direction: 'income',
    })
  })
})
