/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const businessHome =
  readFileSync(
    new URL(
      '../pages/SimpleBusinessHomePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const quickAdd =
  readFileSync(
    new URL(
      '../pages/BusinessQuickAddPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const cashPage =
  readFileSync(
    new URL(
      '../pages/BusinessPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const creditPage =
  readFileSync(
    new URL(
      '../pages/BusinessCreditPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const tradePage =
  readFileSync(
    new URL(
      '../pages/BusinessTradePage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('business payment-message workspace scope', () => {
  it('carries the selected business from Business Home into Add', () => {
    expect(businessHome).toMatch(
      /businessId=\$\{encodeURIComponent\(\s*selectedBusinessId/,
    )
  })

  it('keeps the selected business on message and ordinary quick-add routes', () => {
    expect(quickAdd).toMatch(
      /searchParams\.get\(\s*'businessId'/,
    )

    expect(quickAdd).toMatch(
      /params\.set\(\s*'businessId',\s*requestedBusinessId/,
    )

    expect(quickAdd).toMatch(
      /workspaceRoute\(\s*action\.to/,
    )
  })

  it('validates the requested workspace against existing businesses before selecting it', () => {
    for (
      const source of [
        cashPage,
        creditPage,
        tradePage,
      ]
    ) {
      expect(source).toMatch(
        /records\.find\(\s*\(business\)\s*=>\s*business\.id ===\s*requestedBusinessId/,
      )

      expect(source).toMatch(
        /\?\?\s*records\[0\]\s*\?\?\s*null/,
      )
    }
  })

  it('never creates or changes a business just because a businessId was passed', () => {
    expect(quickAdd).not.toContain(
      'upsertBusinessProfile',
    )

    expect(quickAdd).not.toContain(
      'addBusinessTransaction',
    )
  })
})
