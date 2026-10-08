import { useState, type FormEvent, type JSX } from 'react'
import { ApiError, createJob, type AnalysisType } from '../api'

const ANALYSIS_OPTIONS: ReadonlyArray<{
  value: AnalysisType
  label: string
}> = [
  { value: 'word_count', label: 'word_count — Wörter zählen' },
  { value: 'top_words', label: 'top_words — häufigste Wörter' },
  { value: 'reading_time', label: 'reading_time — geschätzte Lesezeit' },
]

const EMPTY_TEXT_ERROR = 'Der Text darf nicht leer sein.'
const REJECTED_HEADLINE = 'Übermittlung fehlgeschlagen.'
const UNREACHABLE_HEADLINE = 'API nicht erreichbar.'
const UNREACHABLE_DETAIL = 'Der Auftrag konnte nicht gesendet werden.'
const SUCCESS_CONFIRMATION =
  'Auftrag angelegt. Ergebnisse erscheinen in wenigen Sekunden.'

type FormError = { kind: 'rejected' | 'unreachable'; message: string }

/**
 * The job submission form: a text area with a character counter, a native
 * analysis select and the primary submit button.
 *
 * All controls are active. A blank text is never submitted; the API's own
 * rejection message and an unreachable API are shown in an error banner so a
 * failed submission never fails silently (AC-12).
 */
export default function JobForm(): JSX.Element {
  const [text, setText] = useState('')
  const [analysis, setAnalysis] = useState<AnalysisType>('word_count')
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState(false)
  const [error, setError] = useState<FormError | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const hasText = text.trim().length > 0
  const showEmptyError = touched && !hasText

  async function submitJob(): Promise<void> {
    setTouched(true)
    if (text.trim().length === 0) {
      return
    }

    setSubmitting(true)
    setError(null)
    setConfirmation(null)
    try {
      await createJob(text, analysis)
      setText('')
      setAnalysis('word_count')
      setConfirmation(SUCCESS_CONFIRMATION)
    } catch (err) {
      if (err instanceof ApiError && err.status !== 0 && err.code !== 'network_error') {
        setError({
          kind: 'rejected',
          message: err.message || 'Die API hat die Anfrage abgelehnt.',
        })
      } else if (err instanceof ApiError) {
        setError({ kind: 'unreachable', message: UNREACHABLE_DETAIL })
      } else {
        setError({ kind: 'unreachable', message: UNREACHABLE_DETAIL })
      }
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void submitJob()
  }

  function handleRetry(): void {
    setError(null)
    void submitJob()
  }

  return (
    <>
      {error ? (
        <div className="error-banner job-form__banner" role="alert">
          <span className="error-banner__icon" aria-hidden="true">
            !
          </span>
          <div className="error-banner__body">
            <strong>
              {error.kind === 'rejected' ? REJECTED_HEADLINE : UNREACHABLE_HEADLINE}
            </strong>{' '}
            {error.message}
            {error.kind === 'unreachable' ? (
              <button
                type="button"
                className="btn btn--ghost btn--inline"
                onClick={handleRetry}
              >
                Jetzt erneut versuchen
              </button>
            ) : null}
          </div>
          <button
            type="button"
            className="error-banner__close"
            aria-label="Schließen"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      ) : null}

      <form className="job-form" aria-label="Neuer Auftrag" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field__label" htmlFor="job-text">
            Text
          </label>
          <textarea
            id="job-text"
            className={
              showEmptyError ? 'field__textarea field__textarea--invalid' : 'field__textarea'
            }
            placeholder="Text zum Auswerten einfügen oder eingeben …"
            value={text}
            aria-invalid={showEmptyError}
            onChange={(event) => {
              setText(event.target.value)
              setConfirmation(null)
            }}
            onBlur={() => setTouched(true)}
          />
          <div className="field__meta">
            <span
              className={showEmptyError ? 'field__error field__error--visible' : 'field__error'}
            >
              {showEmptyError ? EMPTY_TEXT_ERROR : ''}
            </span>
            <span className="field__counter">{text.length} Zeichen</span>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="job-analysis">
            Analyse
          </label>
          <select
            id="job-analysis"
            className="field__select"
            value={analysis}
            onChange={(event) => setAnalysis(event.target.value as AnalysisType)}
          >
            {ANALYSIS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-footer">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !hasText}
            aria-disabled={submitting || !hasText}
          >
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Wird gesendet…
              </>
            ) : hasText ? (
              'Auftrag anlegen'
            ) : (
              'Auftrag anlegen (Text erforderlich)'
            )}
          </button>
          <p className="form-hint">
            Aufträge laufen im Hintergrund — Ergebnisse erscheinen in wenigen Sekunden.
          </p>
        </div>

        {confirmation ? (
          <p className="form-confirmation" role="status">
            {confirmation}
          </p>
        ) : null}
      </form>
    </>
  )
}
