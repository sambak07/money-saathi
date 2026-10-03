import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  helpGlossary,
  helpManualChapters,
} from './manualContent'
import {
  searchHelpManualChapters,
} from './manualSearch'

function idsFor(
  query: string,
): string[] {
  return searchHelpManualChapters(
    helpManualChapters,
    helpGlossary,
    query,
  ).map(
    (chapter) =>
      chapter.id,
  )
}

describe(
  'searchHelpManualChapters',
  () => {
    it(
      'returns all chapters for an empty query',
      () => {
        expect(
          idsFor('   '),
        ).toHaveLength(26)
      },
    )

    it(
      'is case insensitive',
      () => {
        expect(
          idsFor('SaLaRy'),
        ).toContain(
          'transactions',
        )
      },
    )

    it(
      'finds Regular Money for EMI schedule',
      () => {
        expect(
          idsFor('EMI schedule'),
        ).toContain(
          'regular-money',
        )
      },
    )

    it(
      'finds Backup & Restore for backup merge',
      () => {
        expect(
          idsFor('backup merge'),
        ).toContain(
          'backup-restore',
        )
      },
    )

    it(
      'finds Business or Glossary for COGS',
      () => {
        const ids =
          idsFor('COGS')

        expect(
          ids.some(
            (id) =>
              id === 'business' ||
              id === 'glossary',
          ),
        ).toBe(true)
      },
    )

    it(
      'searches glossary terms and definitions',
      () => {
        expect(
          idsFor('chetrum'),
        ).toContain(
          'glossary',
        )
      },
    )

    it(
      'returns no matches for unrelated text',
      () => {
        expect(
          idsFor(
            'quantum telescope',
          ),
        ).toEqual([])
      },
    )
  },
)
