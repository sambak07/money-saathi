import {
  describe,
  expect,
  it,
} from 'vitest'
import {
  readFileSync,
} from 'node:fs'
import {
  fileURLToPath,
} from 'node:url'

const appPath = fileURLToPath(
  new URL('../App.tsx', import.meta.url),
)

const appSource =
  readFileSync(appPath, 'utf8')

describe('route-level performance', () => {
  it('uses React lazy loading for route pages', () => {
    expect(appSource).toContain(
      'lazy(() => import(',
    )
  })

  it('uses Suspense around the route tree', () => {
    expect(appSource).toContain('<Suspense')
    expect(appSource).toContain(
      'route-loading-shell',
    )
  })

  it('does not statically import page modules', () => {
    expect(appSource).not.toMatch(
      /^import\s+\w+\s+from\s+['"]\.\/pages\//m,
    )
  })

  it('keeps the adaptive app home route', () => {
    expect(appSource).toContain(
      'path="/app" element={<AdaptiveHomeRoute />}',
    )
  })
})
