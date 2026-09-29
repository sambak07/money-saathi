/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const app =
  readFileSync(
    new URL(
      '../App.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const reset =
  readFileSync(
    new URL(
      '../components/RouteScrollReset.tsx',
      import.meta.url,
    ),
    'utf8',
  )

describe('route scroll reset', () => {
  it('mounts the scroll reset inside BrowserRouter', () => {
    expect(app).toContain(
      "import RouteScrollReset from './components/RouteScrollReset'",
    )

    const router =
      app.indexOf(
        '<BrowserRouter>',
      )

    const resetMount =
      app.indexOf(
        '<RouteScrollReset />',
        router,
      )

    expect(router).toBeGreaterThan(
      -1,
    )

    expect(resetMount).toBeGreaterThan(
      router,
    )
  })

  it('resets the viewport when the pathname changes', () => {
    expect(reset).toContain(
      'useLocation()',
    )

    expect(reset).toContain(
      'useLayoutEffect(() =>',
    )

    expect(reset).toContain(
      'window.scrollTo({',
    )

    expect(reset).toContain(
      'top: 0',
    )

    expect(reset).toContain(
      'left: 0',
    )

    expect(reset).toMatch(
      /\},\s*\[\s*pathname,\s*\]\s*\)/,
    )
  })

  it('does not key the reset to search parameters', () => {
    expect(reset).not.toContain(
      'search',
    )

    expect(reset).not.toContain(
      'searchParams',
    )
  })
})
