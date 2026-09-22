/// <reference types="node" />

import {
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import {
  join,
} from 'node:path'
import {
  fileURLToPath,
} from 'node:url'

import {
  describe,
  expect,
  it,
} from 'vitest'

const projectRoot = fileURLToPath(
  new URL('../../', import.meta.url),
)

function rootPath(relativePath: string): string {
  return join(projectRoot, relativePath)
}

function readSource(relativePath: string): string {
  return readFileSync(
    rootPath(relativePath),
    'utf8',
  )
}

function collectRuntimeFiles(
  directoryPath = rootPath('src'),
): string[] {
  const results: string[] = []

  for (const entry of readdirSync(directoryPath)) {
    const fullPath = join(directoryPath, entry)
    const info = statSync(fullPath)

    if (info.isDirectory()) {
      if (
        entry === 'security-audit' ||
        entry === '__tests__'
      ) {
        continue
      }

      results.push(
        ...collectRuntimeFiles(fullPath),
      )
      continue
    }

    if (
      !/\.(ts|tsx)$/.test(entry) ||
      /\.test\.(ts|tsx)$/.test(entry)
    ) {
      continue
    }

    results.push(fullPath)
  }

  return results
}

function readRuntimeSources(): Array<{
  path: string
  source: string
}> {
  return collectRuntimeFiles().map((path) => ({
    path,
    source: readFileSync(path, 'utf8'),
  }))
}

describe('security and privacy release guards', () => {
  it('keeps referrer information private', () => {
    const html = readSource('index.html')

    expect(html).toMatch(
      /<meta\s+name=["']referrer["']\s+content=["']no-referrer["']/i,
    )
  })

  it('contains no runtime external HTTP URLs', () => {
    const violations = readRuntimeSources()
      .filter(({ source }) =>
        /https?:\/\//i.test(source),
      )
      .map(({ path }) => path)

    expect(violations).toEqual([])
  })

  it('contains no runtime network client calls', () => {
    const forbidden = [
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bWebSocket\b/,
      /\bEventSource\b/,
      /\bnavigator\.sendBeacon\b/,
    ]

    const violations = readRuntimeSources()
      .filter(({ source }) =>
        forbidden.some((pattern) =>
          pattern.test(source),
        ),
      )
      .map(({ path }) => path)

    expect(violations).toEqual([])
  })

  it('contains no dangerous dynamic HTML or code execution', () => {
    const forbidden = [
      /\bdangerouslySetInnerHTML\b/,
      /\beval\s*\(/,
      /\bnew\s+Function\s*\(/,
      /\bdocument\.write\s*\(/,
    ]

    const violations = readRuntimeSources()
      .filter(({ source }) =>
        forbidden.some((pattern) =>
          pattern.test(source),
        ),
      )
      .map(({ path }) => path)

    expect(violations).toEqual([])
  })

  it('contains no obvious embedded API secret patterns', () => {
    const forbidden = [
      /\bsk-[A-Za-z0-9_-]{20,}\b/,
      /\bAIza[0-9A-Za-z_-]{20,}\b/,
      /\bghp_[A-Za-z0-9]{20,}\b/,
      /\bAKIA[0-9A-Z]{16}\b/,
    ]

    const violations = readRuntimeSources()
      .filter(({ source }) =>
        forbidden.some((pattern) =>
          pattern.test(source),
        ),
      )
      .map(({ path }) => path)

    expect(violations).toEqual([])
  })

  it('keeps backup encryption parameters at the hardened baseline', () => {
    const source = readSource(
      'src/backup/backup.ts',
    )

    expect(source).toContain(
      'const PBKDF2_ITERATIONS = 600_000',
    )
    expect(source).toContain(
      'const SALT_BYTES = 16',
    )
    expect(source).toContain(
      'const IV_BYTES = 12',
    )
    expect(source).toContain(
      "algorithm: 'AES-GCM-256'",
    )
    expect(source).toContain(
      "kdf: 'PBKDF2-SHA-256'",
    )
    expect(source).toContain(
      "export const BACKUP_AAD = 'MoneySaathiBackup:v1'",
    )
  })

  it('keeps App Lock as a local one-way verifier', () => {
    const source = readSource(
      'src/security/appLock.ts',
    )

    expect(source).toContain(
      'const PBKDF2_ITERATIONS = 600_000',
    )
    expect(source).toContain(
      'const SALT_BYTES = 16',
    )
    expect(source).toContain(
      "'PBKDF2'",
    )
    expect(source).toContain(
      "'SHA-256'",
    )
    expect(source).not.toMatch(
      /pin\s*:\s*pin/i,
    )
  })

  it('keeps the production dependency set free of remote-data SDKs', () => {
    const packageJson = JSON.parse(
      readSource('package.json'),
    ) as {
      dependencies?: Record<string, string>
    }

    const dependencies = Object.keys(
      packageJson.dependencies ?? {},
    )

    const prohibited = [
      'axios',
      'firebase',
      '@supabase/supabase-js',
      '@sentry/react',
      '@segment/analytics-next',
      'mixpanel-browser',
    ]

    expect(
      dependencies.filter((name) =>
        prohibited.includes(name),
      ),
    ).toEqual([])
  })
})
