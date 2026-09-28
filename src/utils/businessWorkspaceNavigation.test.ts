import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  businessWorkspaceRoute,
  businessWorkspaceSearchParams,
  resolveBusinessWorkspaceId,
} from './businessWorkspaceNavigation'

const businesses = [
  {
    id: 'A',
  },
  {
    id: 'B',
  },
]

describe('business workspace navigation', () => {
  it('keeps a valid requested workspace', () => {
    expect(
      resolveBusinessWorkspaceId(
        businesses,
        'B',
      ),
    ).toBe('B')
  })

  it('falls back safely when the requested workspace is invalid', () => {
    expect(
      resolveBusinessWorkspaceId(
        businesses,
        'missing',
      ),
    ).toBe('A')
  })

  it('keeps a still-valid current workspace before falling back to the first', () => {
    expect(
      resolveBusinessWorkspaceId(
        businesses,
        '',
        'B',
      ),
    ).toBe('B')
  })

  it('adds the workspace to business routes without losing existing query values', () => {
    const route =
      businessWorkspaceRoute(
        '/app/business/cash?source=message&intent=running-expense',
        'B',
      )

    const url =
      new URL(
        route,
        'https://money-saathi.local',
      )

    expect(
      url.pathname,
    ).toBe(
      '/app/business/cash',
    )

    expect(
      url.searchParams.get(
        'businessId',
      ),
    ).toBe('B')

    expect(
      url.searchParams.get(
        'source',
      ),
    ).toBe('message')

    expect(
      url.searchParams.get(
        'intent',
      ),
    ).toBe(
      'running-expense',
    )
  })

  it('updates only businessId in an existing search parameter set', () => {
    const current =
      new URLSearchParams(
        'source=message&amountChetrum=32500&businessId=A',
      )

    const next =
      businessWorkspaceSearchParams(
        current,
        'B',
      )

    expect(
      next.get(
        'businessId',
      ),
    ).toBe('B')

    expect(
      next.get(
        'source',
      ),
    ).toBe('message')

    expect(
      next.get(
        'amountChetrum',
      ),
    ).toBe('32500')
  })
})
