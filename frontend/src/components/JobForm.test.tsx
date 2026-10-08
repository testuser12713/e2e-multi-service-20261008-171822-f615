import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExampleTextContext } from '../App'
import type { Job } from '../api'
import { ApiError } from '../api'
import * as api from '../api'
import JobForm from './JobForm'

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api')>()
  return { ...actual, createJob: vi.fn() }
})

const createJobMock = vi.mocked(api.createJob)

const createdJob: Job = {
  id: 1,
  text: 'Hallo Welt',
  analysis: 'word_count',
  status: 'pending',
  result: null,
  error: null,
  created_at: '2026-10-08T17:00:00',
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('JobForm', () => {
  it('submits the text and the chosen analysis via createJob and shows the confirmation', async () => {
    createJobMock.mockResolvedValue(createdJob)
    render(<JobForm />)

    const textarea = screen.getByLabelText('Text')
    fireEvent.change(textarea, { target: { value: 'Hallo Welt' } })
    fireEvent.change(screen.getByLabelText('Analyse'), {
      target: { value: 'top_words' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Auftrag anlegen/ }))

    await waitFor(() => {
      expect(createJobMock).toHaveBeenCalledWith('Hallo Welt', 'top_words')
    })
    expect(createJobMock).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Text')).toHaveValue('')
    expect(screen.getByLabelText('Analyse')).toHaveValue('word_count')
  })

  it('does not submit an empty text and stays neutral before the first interaction', () => {
    render(<JobForm />)

    const form = screen.getByRole('form', { name: 'Neuer Auftrag' })
    expect(screen.queryByText('Der Text darf nicht leer sein.')).not.toBeInTheDocument()

    fireEvent.submit(form)

    expect(createJobMock).not.toHaveBeenCalled()
    expect(screen.getByText('Der Text darf nicht leer sein.')).toBeVisible()
  })

  it('shows the API error message when the submission is rejected', async () => {
    createJobMock.mockRejectedValue(
      new ApiError(400, 'invalid_request', 'Der Text wurde abgelehnt.'),
    )
    render(<JobForm />)

    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'Etwas Text' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Auftrag anlegen/ }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Übermittlung fehlgeschlagen.')
    expect(alert).toHaveTextContent('Der Text wurde abgelehnt.')
  })

  it('shows an unreachable-API message when the network fails', async () => {
    createJobMock.mockRejectedValue(new ApiError(0, 'network_error', 'API not reachable'))
    render(<JobForm />)

    fireEvent.change(screen.getByLabelText('Text'), {
      target: { value: 'Etwas Text' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Auftrag anlegen/ }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('API nicht erreichbar.')
    expect(screen.getByRole('button', { name: 'Jetzt erneut versuchen' })).toBeInTheDocument()
  })

  it('accepts the incoming example text into its controlled text area', () => {
    render(
      <ExampleTextContext.Provider
        value={{
          exampleText: 'Ein Beispieltext aus dem Leerzustand.',
          exampleTextRequestId: 1,
          insertExampleText: () => undefined,
        }}
      >
        <JobForm />
      </ExampleTextContext.Provider>,
    )

    expect(screen.getByLabelText('Text')).toHaveValue('Ein Beispieltext aus dem Leerzustand.')
  })
})
