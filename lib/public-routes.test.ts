import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
const app = readFileSync(new URL('../app/app/page.tsx', import.meta.url), 'utf8')
const signIn = readFileSync(new URL('../app/sign-in/page.tsx', import.meta.url), 'utf8')
const getStarted = readFileSync(new URL('../app/get-started/page.tsx', import.meta.url), 'utf8')
const manifest = readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8')
const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8')

describe('public routing', () => {
  it('keeps the public root separate from the private AppShell', () => {
    expect(root).not.toContain('AppShell')
    expect(app).toContain('AppShell')
    expect(signIn).toContain('PublicEntry')
    expect(getStarted).toContain('PublicEntry')
    expect(manifest).toContain('"start_url":"/app"')
    expect(worker).toContain("caches.match('/app')")
  })
})
