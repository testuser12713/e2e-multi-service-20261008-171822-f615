import type { JSX } from 'react'
import JobForm from './components/JobForm'
import JobList from './components/JobList'

/**
 * The application shell every view renders inside: sticky header, one centred
 * content column, the form panel above the job area. This component is complete
 * and is not edited by later tickets — they fill in JobForm and JobList.
 */
export default function App(): JSX.Element {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-brand">
            <span className="app-brand__mark" aria-hidden="true" />
            <span className="app-brand__name">Auftragsverarbeitung</span>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="form-panel" aria-label="Neuer Auftrag">
          <JobForm />
        </section>

        <section className="job-area" aria-label="Aufträge">
          <JobList />
        </section>
      </main>
    </div>
  )
}
