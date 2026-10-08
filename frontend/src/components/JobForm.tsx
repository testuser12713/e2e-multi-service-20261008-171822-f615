import type { JSX } from 'react'

/**
 * Placeholder for the job submission form (another ticket owns its behaviour).
 *
 * It renders the final shell markup with its controls visibly disabled and a
 * "coming soon" hint, so the product is renderable on its own and no control
 * looks active while doing nothing (AC-11).
 */
export default function JobForm(): JSX.Element {
  return (
    <form
      className="job-form"
      aria-label="Neuer Auftrag"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="field">
        <label className="field__label" htmlFor="job-text">
          Text
        </label>
        <textarea
          id="job-text"
          className="field__textarea"
          placeholder="Text zum Auswerten einfügen oder eingeben …"
          disabled
          aria-disabled="true"
        />
      </div>

      <div className="field">
        <label className="field__label" htmlFor="job-analysis">
          Analyse
        </label>
        <select
          id="job-analysis"
          className="field__select"
          disabled
          aria-disabled="true"
          defaultValue="word_count"
        >
          <option value="word_count">word_count — Wörter zählen</option>
          <option value="top_words">top_words — häufigste Wörter</option>
          <option value="reading_time">reading_time — geschätzte Lesezeit</option>
        </select>
      </div>

      <div className="form-footer">
        <button
          type="submit"
          className="btn btn--primary"
          disabled
          aria-disabled="true"
          title="Noch nicht verfügbar"
        >
          Auftrag erstellen · noch nicht verfügbar
        </button>
        <p className="form-hint">
          Aufträge laufen im Hintergrund — Ergebnisse erscheinen in wenigen Sekunden.
        </p>
      </div>
    </form>
  )
}
