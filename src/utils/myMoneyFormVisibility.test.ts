/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const page =
  readFileSync(
    new URL(
      '../pages/MyMoneyPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('My Money asset form visibility', () => {
  it('reveals the asset form when Add or Edit opens it', () => {
    expect(page).toContain(
      'const assetFormPanelRef =',
    )

    expect(page).toContain(
      'window.requestAnimationFrame(',
    )

    expect(page).toContain(
      'panel.scrollIntoView({',
    )

    expect(page).toContain(
      "block: 'start'",
    )

    expect(page).toContain(
      'panel.focus({',
    )

    expect(page).toContain(
      'preventScroll: true',
    )
  })

  it('makes the revealed form panel focusable and labelled', () => {
    expect(page).toContain(
      'ref={assetFormPanelRef}',
    )

    expect(page).toContain(
      'tabIndex={-1}',
    )

    expect(page).toContain(
      'aria-labelledby="asset-form-title"',
    )

    expect(page).toContain(
      '<h2 id="asset-form-title">',
    )
  })
})
