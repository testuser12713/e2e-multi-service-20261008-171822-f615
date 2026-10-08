import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, fetchJobs } from '../api'
import type { Job } from '../api'
import JobList, { REFRESH_INTERVAL_MS } from './JobList'

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>()
  return { ...actual, fetchJobs: vi.fn() }
})

const mockFetchJobs = vi.mocked(fetchJobs)

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    text: 'Ein Beispieltext mit genug Wörtern für die Analyse.',
    analysis: 'word_count',
    status: 'done',
    result: '8 Wörter',
    error: null,
    created_at: '2026-10-08T17:16:42',
    ...overrides,
  }
}

describe('JobList', () => {
  beforeEach(() => {
    mockFetchJobs.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders every job newest first with text, status and result', async () => {
    mockFetchJobs.mockResolvedValue([
      makeJob({ id: 1, text: 'Älterer Auftrag', status: 'done', result: '35 Wörter' }),
      makeJob({
        id: 2,
        text: 'Neuer Auftrag',
        status: 'running',
        result: null,
        analysis: 'top_words',
      }),
    ])

    render(<JobList />)

    expect(await screen.findByText('Älterer Auftrag')).toBeInTheDocument()

    const articles = screen.getAllByRole('article')
    expect(articles[0]).toHaveTextContent('Neuer Auftrag')
    expect(articles[1]).toHaveTextContent('Älterer Auftrag')

    expect(screen.getByText('fertig')).toBeInTheDocument()
    expect(screen.getByText('in Arbeit')).toBeInTheDocument()
    expect(screen.getByText('35 Wörter')).toBeInTheDocument()
    expect(screen.getByText('word_count — Wörter zählen')).toBeInTheDocument()
    expect(screen.getByText('top_words — häufigste Wörter')).toBeInTheDocument()
  })

  it('refreshes the list from a timer after the interval', async () => {
    const intervalSpy = vi.spyOn(window, 'setInterval')
    mockFetchJobs.mockResolvedValue([])

    render(<JobList />)

    expect(await screen.findByText('Noch keine Aufträge')).toBeInTheDocument()
    expect(mockFetchJobs).toHaveBeenCalledTimes(1)
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), REFRESH_INTERVAL_MS)

    const tick = intervalSpy.mock.calls[0]?.[0] as () => void
    await act(async () => {
      tick()
    })

    expect(mockFetchJobs).toHaveBeenCalledTimes(2)
  })

  it('shows a visible error when the first refresh fails', async () => {
    vi.spyOn(window, 'setInterval')
    mockFetchJobs.mockRejectedValue(new ApiError(0, 'network_error', 'API not reachable'))

    render(<JobList />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('API nicht erreichbar')
  })

  it('keeps the rows already shown when a later refresh fails', async () => {
    const intervalSpy = vi.spyOn(window, 'setInterval')
    mockFetchJobs.mockResolvedValueOnce([makeJob({ id: 1, text: 'Bleibt sichtbar' })])

    render(<JobList />)
    expect(await screen.findByText('Bleibt sichtbar')).toBeInTheDocument()

    mockFetchJobs.mockRejectedValueOnce(new ApiError(0, 'network_error', 'API not reachable'))
    const tick = intervalSpy.mock.calls[0]?.[0] as () => void
    await act(async () => {
      tick()
    })

    expect(screen.getByText('Bleibt sichtbar')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('API nicht erreichbar')
  })
})
