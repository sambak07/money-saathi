import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  helpGlossary,
  helpManualChapters,
} from './manualContent'

describe(
  'help manual content',
  () => {
    it(
      'contains exactly 26 chapters',
      () => {
        expect(
          helpManualChapters,
        ).toHaveLength(26)
      },
    )

    it(
      'uses unique chapter ids and numbers',
      () => {
        const ids =
          helpManualChapters.map(
            (chapter) =>
              chapter.id,
          )

        const numbers =
          helpManualChapters.map(
            (chapter) =>
              chapter.number,
          )

        expect(
          new Set(ids).size,
        ).toBe(26)

        expect(
          new Set(numbers).size,
        ).toBe(26)
      },
    )

    it(
      'keeps every required documentation field populated',
      () => {
        for (
          const chapter of
          helpManualChapters
        ) {
          expect(
            chapter.title.trim(),
          ).not.toBe('')

          expect(
            chapter.whatItIs.trim(),
          ).not.toBe('')

          expect(
            chapter.whenToUse.trim(),
          ).not.toBe('')

          expect(
            chapter.whenNotToUse.trim(),
          ).not.toBe('')

          expect(
            chapter.example.trim(),
          ).not.toBe('')

          expect(
            chapter.steps.trim(),
          ).not.toBe('')

          expect(
            chapter.afterSaving.trim(),
          ).not.toBe('')

          expect(
            chapter.mistakes.trim(),
          ).not.toBe('')

          expect(
            chapter.relatedFeatures.trim(),
          ).not.toBe('')

          expect(
            chapter.privacyNote.trim(),
          ).not.toBe('')
        }
      },
    )

    it(
      'includes the audited glossary terms',
      () => {
        expect(
          helpGlossary,
        ).toHaveLength(42)

        expect(
          helpGlossary.map(
            (entry) =>
              entry.term,
          ),
        ).toContain('Chetrum')

        expect(
          helpGlossary.map(
            (entry) =>
              entry.term,
          ),
        ).toContain('COGS')
      },
    )
  },
)
