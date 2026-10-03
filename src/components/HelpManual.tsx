import {
  useMemo,
  useState,
} from 'react'
import {
  Link,
} from 'react-router-dom'

import {
  helpGlossary,
  helpManualChapters,
  type HelpManualChapter,
} from '../help/manualContent'
import {
  searchHelpManualChapters,
} from '../help/manualSearch'

import '../styles/help-manual.css'

interface ManualBlockProps {
  label: string
  text: string
  wide?: boolean
  safety?: boolean
}

function ManualBlock({
  label,
  text,
  wide = false,
  safety = false,
}: ManualBlockProps) {
  return (
    <div
      className={[
        'help-manual-block',
        wide
          ? 'wide'
          : '',
        safety
          ? 'safety'
          : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span>
        {label}
      </span>

      <p>
        {text}
      </p>
    </div>
  )
}

function ChapterDetails({
  chapter,
  searching,
}: {
  chapter: HelpManualChapter
  searching: boolean
}) {
  return (
    <details
      id={`help-chapter-${chapter.id}`}
      className="help-manual-chapter"
      open={searching}
    >
      <summary>
        <span className="help-manual-number">
          {chapter.number}
        </span>

        <span className="help-manual-summary-copy">
          <strong>
            {chapter.title}
          </strong>

          <small>
            {chapter.whatItIs}
          </small>
        </span>

        <span
          className="help-manual-summary-mark"
          aria-hidden="true"
        >
          +
        </span>
      </summary>

      <div className="help-manual-body">
        {chapter.routes.length > 0 && (
          <div className="help-manual-routes">
            <span>
              Where to find it
            </span>

            <div>
              {chapter.routes.map(
                (route) => (
                  <Link
                    key={route}
                    to={route}
                  >
                    {route}
                  </Link>
                ),
              )}
            </div>
          </div>
        )}

        <ManualBlock
          label="What it is"
          text={chapter.whatItIs}
        />

        <ManualBlock
          label="When to use it"
          text={chapter.whenToUse}
        />

        <ManualBlock
          label="When not to use it"
          text={chapter.whenNotToUse}
        />

        <ManualBlock
          label="Ngultrum example"
          text={chapter.example}
        />

        <ManualBlock
          label="Step by step"
          text={chapter.steps}
          wide
        />

        <ManualBlock
          label="What happens after saving"
          text={chapter.afterSaving}
        />

        <ManualBlock
          label="Common mistakes"
          text={chapter.mistakes}
        />

        <ManualBlock
          label="Related features"
          text={chapter.relatedFeatures}
        />

        <ManualBlock
          label="Privacy / safety note"
          text={chapter.privacyNote}
          wide
          safety
        />

        {chapter.id === 'glossary' && (
          <div className="help-glossary wide">
            <h3>
              Money Saathi terms
            </h3>

            <dl>
              {helpGlossary.map(
                (entry) => (
                  <div key={entry.term}>
                    <dt>
                      {entry.term}
                    </dt>

                    <dd>
                      {entry.definition}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          </div>
        )}
      </div>
    </details>
  )
}

function HelpManual() {
  const [
    query,
    setQuery,
  ] =
    useState('')

  const chapters =
    useMemo(
      () =>
        searchHelpManualChapters(
          helpManualChapters,
          helpGlossary,
          query,
        ),
      [query],
    )

  const searching =
    query.trim().length > 0

  return (
    <section
      id="full-user-manual"
      className="help-manual"
      aria-labelledby="help-manual-heading"
    >
      <header className="help-manual-heading">
        <p className="dashboard-eyebrow">
          Full reference
        </p>

        <h2 id="help-manual-heading">
          Full User Manual
        </h2>

        <p>
          Search the built-in guide or open any chapter.
          Search runs locally over this bundled manual and
          does not read your financial records.
        </p>
      </header>

      <div className="help-manual-search">
        <label htmlFor="help-manual-search">
          Search Help
        </label>

        <input
          id="help-manual-search"
          type="search"
          value={query}
          placeholder="Try FD, EMI, salary, backup or business dues"
          autoComplete="off"
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
        />

        <div
          className="help-manual-search-status"
          aria-live="polite"
        >
          <strong>
            {chapters.length}
          </strong>

          <span>
            {chapters.length === 1
              ? ' chapter'
              : ' chapters'}
            {searching
              ? ' matched'
              : ' in this guide'}
          </span>
        </div>
      </div>

      {chapters.length === 0 ? (
        <div
          className="help-manual-empty"
          role="status"
        >
          <strong>
            No manual chapter matched that search.
          </strong>

          <p>
            Try a simpler term such as salary, EMI,
            FD, backup, Vault, Business or privacy.
          </p>
        </div>
      ) : (
        <div className="help-manual-list">
          {chapters.map(
            (chapter) => (
              <ChapterDetails
                key={chapter.id}
                chapter={chapter}
                searching={searching}
              />
            ),
          )}
        </div>
      )}
    </section>
  )
}

export default HelpManual
