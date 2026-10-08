import { useCallback, useEffect, useState } from 'react'
import type { JSX } from 'react'
import { ApiError, fetchJobs } from '../api'
import type { Job } from '../api'
import JobItem from './JobItem'

/**
 * The job list: every job newest first, refreshed automatically on a timer
 * (AC-07, AC-08). A failed refresh keeps the rows already shown and turns the
 * refresh indicator into its paused state with the error banner of the
 * api-unreachable mockup.
 */

/** How often the list refreshes itself, in milliseconds. */
export const REFRESH_INTERVAL_MS = 5000

const NETWORK_ERROR_MESSAGE = 'API nicht erreichbar'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** 'HH:MM:SS' for the refresh indicator. */
function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/** 'HH:MM' for the "last known list from …" line. */
function formatMinute(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Newest first, by creation time with the auto-increment id as tie-break. */
function sortNewestFirst(jobs: Job[]): Job[] {
  return [...jobs].sort((left, right) => {
    const leftTime = Date.parse(left.created_at)
    const rightTime = Date.parse(right.created_at)
    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime !== rightTime) {
      return rightTime - leftTime
    }
    return right.id - left.id
  })
}

function SkeletonCard(): JSX.Element {
  return (
    <article className="skeleton-card">
      <div className="job-card__top">
        <span className="sk sk--badge" />
        <span className="sk sk--meta" />
      </div>
      <div className="sk sk--line" />
      <div className="sk sk--line sk--line-w70" />
      <div className="sk sk--result" />
    </article>
  )
}

export default function JobList(): JSX.Element {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const refresh = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    try {
      const next = await fetchJobs()
      setJobs(sortNewestFirst(next))
      setLoaded(true)
      setError(null)
      setDismissed(false)
      setLastUpdated(new Date())
    } catch (caught) {
      // Keep the rows already shown; only surface the failure (AC-12).
      if (caught instanceof ApiError && caught.status !== 0) {
        setError(caught.message)
      } else {
        setError(NETWORK_ERROR_MESSAGE)
      }
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, REFRESH_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  const hasRows = jobs.length > 0
  const showSkeleton = refreshing && !hasRows && error === null
  const showEmpty = !showSkeleton && !hasRows && error === null && loaded
  const showError = error !== null && !dismissed

  let refreshText: JSX.Element
  if (refreshing) {
    refreshText = (
      <>
        <span className="spinner" aria-hidden="true" /> Aktualisiere…
      </>
    )
  } else if (error !== null) {
    refreshText = <>Auto-Aktualisierung pausiert — neuer Versuch</>
  } else if (lastUpdated !== null) {
    refreshText = (
      <>
        Auto-Aktualisierung alle {REFRESH_INTERVAL_MS / 1000} s · letzte Aktualisierung{' '}
        {formatClock(lastUpdated)}
      </>
    )
  } else {
    refreshText = <>Auto-Aktualisierung alle {REFRESH_INTERVAL_MS / 1000} s</>
  }

  const refreshClass =
    error !== null && !refreshing ? 'refresh-status refresh-status--paused' : 'refresh-status'

  return (
    <div className="job-list">
      <div className="job-list__header">
        <span className={refreshClass} role="status" aria-live="polite">
          {refreshText}
        </span>
      </div>

      {showError ? (
        <div className="error-banner" role="alert">
          <span className="error-banner__icon" aria-hidden="true">
            !
          </span>
          <div className="error-banner__body">
            <strong>{error}.</strong>{' '}
            {lastUpdated !== null
              ? `Zeige die zuletzt bekannte Liste von ${formatMinute(lastUpdated)}.`
              : 'Die Liste wird automatisch erneut geladen.'}{' '}
            <button
              type="button"
              className="btn btn--ghost error-banner__retry"
              onClick={() => {
                void refresh()
              }}
            >
              Jetzt erneut versuchen
            </button>
          </div>
          <button
            type="button"
            className="error-banner__close"
            aria-label="Schließen"
            onClick={() => setDismissed(true)}
          >
            ×
          </button>
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="job-list__items" aria-hidden="true">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : null}

      {showEmpty ? (
        <div className="empty-state">
          <h2 className="empty-state__headline">Noch keine Aufträge</h2>
          <p className="empty-state__body">
            Gib oben einen Text ein, wähle eine Analyse und lege den Auftrag an.
          </p>
          <button
            type="button"
            className="btn btn--ghost"
            disabled
            aria-disabled="true"
            title="Noch nicht verfügbar"
          >
            Beispieltext einfügen · noch nicht verfügbar
          </button>
        </div>
      ) : null}

      {hasRows ? (
        <div className="job-list__items">
          {jobs.map((job) => (
            <JobItem key={job.id} job={job} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
