'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { UserType } from '@/lib/settings'
import {
  BUSINESS_DISCLAIMER,
  EDUCATION_DISCLAIMER,
  REGULATORY_NOTE,
  recommendedLessons,
  topicGroups,
  type Lesson,
  type TryItDestination,
} from '@/lib/learn-content'

type LearnViewProps = {
  userType?: UserType
  onNavigate: (view: string) => void
}

function LessonCard({ lesson, sectionId, open, onToggle, onNavigate }: { lesson: Lesson; sectionId: string; open: boolean; onToggle: () => void; onNavigate: (view: TryItDestination) => void }) {
  const panelId = `learn-${sectionId}-${lesson.id}`
  return (
    <div className={open ? 'learn-card open' : 'learn-card'}>
      <button type="button" className="learn-card-head" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className="learn-card-title">{lesson.title}</span>
        <ChevronDown size={18} className="learn-card-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="learn-detail" id={panelId}>
          {lesson.paragraphs.map((paragraph, index) => (
            <p key={index} className="learn-paragraph">{paragraph}</p>
          ))}
          {lesson.example && (
            <p className="learn-example"><span className="learn-label">Example</span>{lesson.example}</p>
          )}
          <p className="learn-key"><span className="learn-label">Key point</span>{lesson.keyPoint}</p>
          {lesson.tryIt && (
            <button type="button" className="secondary-button learn-tryit" onClick={() => onNavigate(lesson.tryIt!.destination)}>
              Try it · {lesson.tryIt.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function LearnView({ userType, onNavigate }: LearnViewProps) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const recommended = recommendedLessons(userType).slice(0, 6)
  const toggle = (key: string) => setOpenKey(current => (current === key ? null : key))

  return (
    <div className="learn-view">
      <header className="learn-header">
        <p className="eyebrow">Learn</p>
        <h1>Money Guide</h1>
        <p className="subheading">Understand money, banking and financial safety in simple language.</p>
      </header>

      <section className="panel learn-section" aria-labelledby="learn-recommended-heading">
        <div className="panel-heading"><div><p className="eyebrow">For you</p><h2 id="learn-recommended-heading">Recommended for you</h2></div></div>
        <div className="learn-grid">
          {recommended.map(lesson => {
            const key = `rec:${lesson.id}`
            return <LessonCard key={key} lesson={lesson} sectionId="rec" open={openKey === key} onToggle={() => toggle(key)} onNavigate={onNavigate} />
          })}
        </div>
      </section>

      <section className="learn-explore" aria-labelledby="learn-explore-heading">
        <div className="learn-explore-head"><p className="eyebrow">All topics</p><h2 id="learn-explore-heading">Explore all topics</h2></div>
        {topicGroups.map(group => (
          <section key={group.id} className="panel learn-section" aria-labelledby={`learn-group-${group.id}`}>
            <div className="learn-group-head">
              <span className="learn-group-letter" aria-hidden="true">{group.letter}</span>
              <div><h3 id={`learn-group-${group.id}`}>{group.title}</h3><p className="subheading">{group.summary}</p></div>
            </div>
            <div className="learn-grid">
              {group.lessons.map(lesson => {
                const key = `${group.id}:${lesson.id}`
                return <LessonCard key={key} lesson={lesson} sectionId={group.id} open={openKey === key} onToggle={() => toggle(key)} onNavigate={onNavigate} />
              })}
            </div>
            {group.id === 'kyc-awareness' && <p className="learn-note form-hint">{REGULATORY_NOTE}</p>}
            {group.id === 'small-business' && <p className="learn-note form-hint">{BUSINESS_DISCLAIMER}</p>}
          </section>
        ))}
      </section>

      <p className="learn-footer form-hint">{EDUCATION_DISCLAIMER}</p>
    </div>
  )
}
