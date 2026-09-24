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
      '../pages/AskSaathiPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const router =
  readFileSync(
    new URL(
      './localQuestionRouter.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('local Ask Saathi language integration', () => {
  it('offers natural-language questions without claiming AI', () => {
    expect(page).toContain(
      'Ask in your own words',
    )

    expect(page).toContain(
      'Ask locally',
    )

    expect(page).toContain(
      'does not send your',
    )
  })

  it('does not contain network calls or API-key handling', () => {
    expect(router).not.toContain(
      'fetch(',
    )

    expect(router).not.toContain(
      'apiKey',
    )

    expect(router).not.toContain(
      'OPENAI',
    )
  })

  it('fails safely when a question is unsupported', () => {
    expect(page).toContain(
      'I could not safely match that question yet.',
    )
  })
})