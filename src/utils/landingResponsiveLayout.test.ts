import { readFileSync } from 'node:fs'
import postcss, { type AtRule, type Document } from 'postcss'
import { describe, expect, it } from 'vitest'

const css = postcss.parse(
  readFileSync(new URL('../styles/landing.css', import.meta.url), 'utf8'),
)

function declarationAtWidth(selector: string, property: string, width: number) {
  let value: string | undefined

  css.walkRules((rule) => {
    if (!rule.selectors.includes(selector)) return

    for (let parent: typeof rule.parent | Document = rule.parent; parent; parent = parent.parent) {
      if (parent.type !== 'atrule') continue
      const media = parent as AtRule
      if (media.name !== 'media') continue
      const maximum = /^\(max-width:\s*(\d+)px\)$/.exec(media.params)
      if (!maximum || width > Number(maximum[1])) return
    }

    rule.walkDecls(property, (declaration) => {
      value = declaration.value
    })
  })

  return value
}

describe('landing responsive containment rules', () => {
  it.each([320, 390])('removes intrinsic grid minimums at %ipx', (width) => {
    expect(declarationAtWidth('.hero', 'grid-template-columns', width))
      .toBe('minmax(0, 1fr)')
    expect(declarationAtWidth('.hero-actions', 'grid-template-columns', width))
      .toBe('minmax(0, 1fr)')
  })

  it.each([320, 390])('lets the header reflow around the brand at %ipx', (width) => {
    expect(declarationAtWidth('.site-header', 'flex-wrap', width)).toBe('wrap')
  })

  it('preserves the desktop grid and action layout', () => {
    expect(declarationAtWidth('.hero', 'grid-template-columns', 1200))
      .toBe('minmax(0, 1.1fr) minmax(340px, 0.9fr)')
    expect(declarationAtWidth('.hero-actions', 'display', 1200)).toBe('flex')
    expect(declarationAtWidth('.site-header', 'flex-wrap', 1200)).toBeUndefined()
  })
})
