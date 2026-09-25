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

const privacy =
  readSource('../pages/SaathiPrivacyPage.tsx')

const guide =
  readSource('../pages/SaathiGuidePage.tsx')

const more =
  readSource('../pages/MorePage.tsx')

const permissions =
  readSource('./contextPermissions.ts')

describe('Saathi local-only alignment', () => {
  it('describes Saathi permissions as local data controls', () => {
    expect(privacy).toContain(
      'Local Saathi data access',
    )

    expect(privacy).toContain(
      'question-specific local guidance',
    )

    expect(privacy).not.toContain(
      'Future AI data access',
    )

    expect(privacy).not.toContain(
      'future Saathi AI request',
    )
  })

  it('keeps Money Vault outside local Saathi question tools', () => {
    expect(privacy).toContain(
      'not available to local Saathi question tools',
    )
  })

  it('removes obsolete future-AI navigation copy', () => {
    expect(guide).toContain(
      'Review local Saathi data permissions',
    )

    expect(more).toContain(
      'local records Saathi may use',
    )

    expect(guide).not.toContain(
      'future AI data permissions',
    )
  })

  it('keeps the existing local permission schema compatible', () => {
    expect(permissions).toContain(
      'money-saathi:saathi-context-permissions:v1',
    )

    expect(permissions).toContain(
      'version: 1',
    )
  })
})