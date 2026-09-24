/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

function readSource(
  relativePath: string,
): string {
  return readFileSync(
    new URL(
      relativePath,
      import.meta.url,
    ),
    'utf8',
  )
}

const page =
  readSource('../pages/AskSaathiPage.tsx')

const app =
  readSource('../App.tsx')

describe('Ask Saathi integration', () => {
  it('adds Ask Saathi as a protected route', () => {
    expect(app).toContain(
      'path="/app/saathi/ask"',
    )
  })

  it('keeps this stage deterministic and local', () => {
    expect(page).toContain(
      'There is no generative AI call in this stage.',
    )

    expect(page).toContain(
      'Money Vault',
    )

    expect(page).toContain(
      'external AI models',
    )
  })

  it('does not present affordability as a guarantee', () => {
    expect(page).toContain(
      'not a guarantee that',
    )

    expect(page).toContain(
      'does not assume future income',
    )
  })

  it('shows the evidence basis for the tools', () => {
    expect(page).toContain(
      'Based on',
    )

    expect(page).toContain(
      'Not used',
    )
  })
})