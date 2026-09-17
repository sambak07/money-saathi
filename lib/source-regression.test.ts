import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../components/money-saathi/app-shell.tsx', import.meta.url), 'utf8') + readFileSync(new URL('../components/money-saathi/budget-view.tsx', import.meta.url), 'utf8')

describe('production source regressions', () => {
  it('contains no native browser dialogs or dead false branches', () => {
    expect(source).not.toContain('window.prompt(')
    expect(source).not.toContain('window.confirm(')
    expect(source).not.toContain('window.alert(')
    expect(source).not.toContain('if (false)')
  })
})
