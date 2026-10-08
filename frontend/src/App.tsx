import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type JSX,
} from 'react'
import JobForm from './components/JobForm'
import JobList from './components/JobList'

/**
 * The example text the empty-state button offers to insert. App owns it as the
 * single source of truth so JobList can trigger the fill without owning JobForm
 * (AC-11, DESIGN.md EmptyState).
 */
export const EXAMPLE_TEXT =
  'Die Auftragsverarbeitung nimmt Textaufträge entgegen, wertet sie im Hintergrund aus und zeigt das Ergebnis automatisch in der Liste an. Lege diesen Auftrag an, um den Ablauf zu sehen.'

/**
 * The shared channel between the empty-state button (JobList) and the text area
 * (JobForm). App owns the value and the setter; both children consume it, so the
 * two stay prop-less.
 */
export type ExampleTextChannel = {
  /** The example text JobForm should place into its text area. */
  exampleText: string
  /** Bumped on every request so a repeated click re-fills an emptied text area. */
  exampleTextRequestId: number
  /** The setter JobList's 'Beispieltext einfügen' button calls. */
  insertExampleText: () => void
}

const NOOP_INSERT_EXAMPLE_TEXT = (): void => undefined

export const ExampleTextContext = createContext<ExampleTextChannel>({
  exampleText: '',
  exampleTextRequestId: 0,
  insertExampleText: NOOP_INSERT_EXAMPLE_TEXT,
})

/** Read the shared example-text channel. Falls back to a neutral value. */
export function useExampleText(): ExampleTextChannel {
  return useContext(ExampleTextContext)
}

/**
 * The application shell every view renders inside: sticky header, one centred
 * content column, the form panel above the job area. App owns the layout and the
 * shared example-text channel between JobList and JobForm.
 */
export default function App(): JSX.Element {
  const [exampleText, setExampleText] = useState('')
  const [exampleTextRequestId, setExampleTextRequestId] = useState(0)

  const insertExampleText = useCallback((): void => {
    setExampleText(EXAMPLE_TEXT)
    setExampleTextRequestId((requestId) => requestId + 1)
  }, [])

  const channel = useMemo<ExampleTextChannel>(
    () => ({ exampleText, exampleTextRequestId, insertExampleText }),
    [exampleText, exampleTextRequestId, insertExampleText],
  )

  return (
    <ExampleTextContext.Provider value={channel}>
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
    </ExampleTextContext.Provider>
  )
}
