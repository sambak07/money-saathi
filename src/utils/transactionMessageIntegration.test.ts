/// <reference types="node" />

import {
  readFileSync,
} from 'node:fs'
import {
  describe,
  expect,
  it,
} from 'vitest'

const form =
  readFileSync(
    new URL(
      '../pages/TransactionFormPage.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const parser =
  readFileSync(
    new URL(
      './transactionMessage.ts',
      import.meta.url,
    ),
    'utf8',
  )

describe('paste-message transaction import integration', () => {
  it('keeps message interpretation local and deterministic', () => {
    expect(parser).not.toContain(
      'fetch(',
    )

    expect(parser).not.toContain(
      'XMLHttpRequest',
    )

    expect(parser).not.toContain(
      'axios',
    )

    expect(parser).not.toContain(
      'openai',
    )
  })

  it('requires review and never saves directly from message analysis', () => {
    expect(form).toContain(
      'Paste transaction message',
    )

    expect(form).toContain(
      'Read message locally',
    )

    expect(form).toContain(
      'Use detected details',
    )

    expect(form).toContain(
      'Nothing is saved until you review and save the transaction.',
    )

    expect(form).toContain(
      'A credit can be a transfer, not income.',
    )
  })
})
