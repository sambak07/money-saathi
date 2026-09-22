import {
  describe,
  expect,
  it,
} from 'vitest'

import type { FinancialScheme } from '../types/scheme'
import {
  annualContributionChetrum,
} from './schemes'

function scheme(
  frequency: FinancialScheme['contributionFrequency'],
  contributionChetrum: number,
): FinancialScheme {
  return {
    id: 'scheme',
    name: 'Scheme',
    provider: '',
    category: 'other',
    status: 'active',
    contributionChetrum,
    contributionFrequency: frequency,
    currentValueChetrum: 0,
    protectionCoverChetrum: 0,
    futureBenefitChetrum: 0,
    startDate: '2026-01-01',
    nextContributionDate: '',
    maturityDate: '',
    note: '',
    createdAt: 1,
    updatedAt: 1,
  }
}

describe('scheme calculations', () => {
  it('annualizes monthly contributions', () => {
    expect(
      annualContributionChetrum(
        scheme('monthly', 50_000),
      ),
    ).toBe(600_000)
  })

  it('annualizes quarterly contributions', () => {
    expect(
      annualContributionChetrum(
        scheme('quarterly', 50_000),
      ),
    ).toBe(200_000)
  })

  it('does not invent annual values for irregular contributions', () => {
    expect(
      annualContributionChetrum(
        scheme('irregular', 50_000),
      ),
    ).toBe(0)
  })
})
