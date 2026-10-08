import type { JSX } from 'react'

/**
 * Placeholder for the job list (another ticket owns its behaviour).
 *
 * It renders the final empty state so the shell is usable on its own; the
 * example-text control is disabled because it cannot act yet (AC-11).
 */
export default function JobList(): JSX.Element {
  return (
    <div className="job-list">
      <div className="empty-state">
        <h2 className="empty-state__headline">Noch keine Aufträge</h2>
        <p className="empty-state__body">
          Geben Sie oben einen Text ein, wählen Sie eine Analyse und senden Sie den Auftrag ab.
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
    </div>
  )
}
