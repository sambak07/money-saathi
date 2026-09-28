/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function source(
  path: string,
): string {
  return readFileSync(
    new URL(
      path,
      import.meta.url,
    ),
    'utf8',
  )
}

const home =
  source('../pages/SimpleBusinessHomePage.tsx')

const cash =
  source('../pages/BusinessPage.tsx')

const inventory =
  source('../pages/BusinessInventoryPage.tsx')

const trade =
  source('../pages/BusinessTradePage.tsx')

const credit =
  source('../pages/BusinessCreditPage.tsx')

const reports =
  source('../pages/BusinessReportsPage.tsx')

const quickAdd =
  source('../pages/BusinessQuickAddPage.tsx')

describe('business workspace navigation integration', () => {
  it('reads businessId on every selectable business module', () => {
    for (
      const page of [
        home,
        cash,
        inventory,
        trade,
        credit,
        reports,
      ]
    ) {
      expect(page).toMatch(
        /searchParams\.get\(\s*'businessId'/,
      )

      expect(page).toContain(
        'resolveBusinessWorkspaceId(',
      )
    }
  })

  it('synchronizes selector changes back to the URL', () => {
    for (
      const page of [
        home,
        cash,
        inventory,
        trade,
        credit,
        reports,
      ]
    ) {
      expect(page).toContain(
        'businessWorkspaceSearchParams(',
      )

      expect(page).toContain(
        'setSearchParams(',
      )
    }
  })

  it('preserves the selected workspace when navigating between business modules', () => {
    for (
      const page of [
        home,
        cash,
        inventory,
        trade,
        credit,
        reports,
      ]
    ) {
      expect(page).toContain(
        'businessWorkspaceRoute(',
      )
    }

    expect(quickAdd).toContain(
      'workspaceRoute(',
    )
  })

  it('does not silently force Inventory or Business Home back to the first workspace', () => {
    expect(inventory).not.toMatch(
      /setSelectedBusinessId\(\s*records\[0\]\?\.id/,
    )

    expect(home).not.toMatch(
      /setSelectedBusinessId\(\s*records\[0\]\?\.id/,
    )
  })
})
