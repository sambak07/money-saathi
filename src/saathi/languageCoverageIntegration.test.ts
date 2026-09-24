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

const floating =
  readSource('../components/SaathiFloatingAssistant.tsx')

const fullPage =
  readSource('../pages/AskSaathiPage.tsx')

describe('Saathi financial-inclusion language responses', () => {
  it('gives a useful first-saving answer even with no recorded transactions', () => {
    expect(floating).toContain(
      'A good first step is to record your real income and expenses.',
    )

    expect(fullPage).toContain(
      'A good first step is to record your real income and expenses.',
    )
  })

  it('does not impose a generic savings percentage', () => {
    expect(floating).toContain(
      'rather than forcing a fixed percentage',
    )

    expect(floating).not.toContain(
      'save 20%',
    )
  })

  it('does not invent salary data', () => {
    expect(floating).toContain(
      'I will not build a plan from an assumed salary amount.',
    )
  })

  it('keeps spending guidance grounded in recorded transactions', () => {
    expect(floating).toContain(
      'Without real transactions, I should not guess where your money is going.',
    )
  })
})