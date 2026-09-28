import {
  describe,
  expect,
  it,
} from 'vitest'

import type {
  MoneyAlert,
} from '../utils/moneyAlerts'
import {
  filterVisibleMoneyAlerts,
} from './alertUniverse'

function alert(
  id: string,
): MoneyAlert {
  return {
    id,
    level: 'attention',
    status: 'soon',
    source: 'deposit',
    title: id,
    detail: id,
    dueDate:
      '2026-09-30',
    amountChetrum:
      null,
    href:
      '/app/my-money',
    actionLabel:
      'Review',
    notificationEligible:
      true,
  }
}

describe('shared alert universe', () => {
  it('filters alerts hidden for today without changing the underlying alert set', () => {
    const alerts = [
      alert('keep'),
      alert('hide'),
    ]

    const visible =
      filterVisibleMoneyAlerts(
        alerts,
        new Set([
          'hide',
        ]),
      )

    expect(
      visible.map(
        (item) => item.id,
      ),
    ).toEqual([
      'keep',
    ])

    expect(
      alerts,
    ).toHaveLength(2)
  })
})
