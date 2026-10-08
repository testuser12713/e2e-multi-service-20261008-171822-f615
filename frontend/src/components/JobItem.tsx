import { useState } from 'react'
import type { JSX } from 'react'
import type { AnalysisType, Job, JobStatus } from '../api'

/**
 * One job row. Renders the status badge (German label + dot), the clickable
 * text clamped to three lines, the analysis name and the result block of the
 * design mockups (index.html / api-unreachable.html).
 */

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'wartend',
  running: 'in Arbeit',
  done: 'fertig',
  failed: 'fehlgeschlagen',
}

const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  word_count: 'word_count — Wörter zählen',
  top_words: 'top_words — häufigste Wörter',
  reading_time: 'reading_time — geschätzte Lesezeit',
}

/** Local timestamp in the single app-wide format 'YYYY-MM-DD HH:MM'. */
function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  const pad = (value: number): string => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

interface JobItemProps {
  job: Job
}

export default function JobItem({ job }: JobItemProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  const toggle = (): void => setExpanded((value) => !value)

  const isWaiting = job.status === 'pending'
  const isRunning = job.status === 'running'

  let resultText: string
  if (isWaiting) {
    resultText = 'Warte auf Worker…'
  } else if (isRunning) {
    resultText = 'Analysiere…'
  } else if (job.status === 'failed') {
    resultText = job.error ? `Fehler: ${job.error}` : 'Fehler: Analyse fehlgeschlagen.'
  } else {
    resultText = job.result ?? 'Kein Ergebnis'
  }

  const cardModifier =
    job.status === 'done' ? ' job-card--done' : job.status === 'failed' ? ' job-card--failed' : ''

  return (
    <article className={`job-card${cardModifier}`}>
      <div className="job-card__top">
        <span className={`status-badge status-badge--${job.status}`}>
          <span className="status-badge__dot" aria-hidden="true" />
          {STATUS_LABELS[job.status]}
        </span>
        <span className="job-card__meta">
          #{job.id} · {formatTimestamp(job.created_at)}
        </span>
      </div>

      <p
        className={`job-card__text${expanded ? ' job-card__text--expanded' : ''}`}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            toggle()
          }
        }}
      >
        {job.text}
      </p>

      <button type="button" className="job-card__toggle" aria-expanded={expanded} onClick={toggle}>
        {expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
      </button>

      <div className="job-card__analysis">{ANALYSIS_LABELS[job.analysis]}</div>

      <div className={`job-result job-result--${job.status}`}>
        {resultText}
        {isWaiting || isRunning ? <span className="progress" aria-hidden="true" /> : null}
      </div>
    </article>
  )
}
