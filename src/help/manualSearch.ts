import type {
  HelpGlossaryEntry,
  HelpManualChapter,
} from './manualContent'

function normalize(
  value: string,
): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9.]+/g, ' ')
    .trim()
}

function chapterSearchText(
  chapter: HelpManualChapter,
  glossary: HelpGlossaryEntry[],
): string {
  const glossaryText =
    chapter.id === 'glossary'
      ? glossary
          .map(
            (entry) =>
              `${entry.term} ${entry.definition}`,
          )
          .join(' ')
      : ''

  return normalize(
    [
      chapter.number,
      chapter.title,
      chapter.routes.join(' '),
      chapter.whatItIs,
      chapter.whenToUse,
      chapter.whenNotToUse,
      chapter.example,
      chapter.steps,
      chapter.afterSaving,
      chapter.mistakes,
      chapter.relatedFeatures,
      chapter.privacyNote,
      chapter.keywords.join(' '),
      glossaryText,
    ].join(' '),
  )
}

export function searchHelpManualChapters(
  chapters: HelpManualChapter[],
  glossary: HelpGlossaryEntry[],
  query: string,
): HelpManualChapter[] {
  const normalizedQuery =
    normalize(query)

  if (!normalizedQuery) {
    return chapters
  }

  const tokens =
    normalizedQuery
      .split(/\s+/)
      .filter(Boolean)

  return chapters.filter(
    (chapter) => {
      const haystack =
        chapterSearchText(
          chapter,
          glossary,
        )

      return tokens.every(
        (token) =>
          haystack.includes(token),
      )
    },
  )
}
