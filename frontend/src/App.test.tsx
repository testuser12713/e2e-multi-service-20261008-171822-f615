import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App, { EXAMPLE_TEXT } from './App'

vi.mock('./api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api')>()
  return { ...actual, fetchJobs: vi.fn().mockResolvedValue([]) }
})

describe('App shell', () => {
  it('renders the app shell with the header, the disabled form and the empty job area', async () => {
    render(<App />)

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('Auftragsverarbeitung')).toBeInTheDocument()

    const textarea = screen.getByLabelText('Text')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toBeEnabled()

    const select = screen.getByLabelText('Analyse')
    expect(select).toBeInTheDocument()
    expect(select).toBeEnabled()

    expect(screen.getByRole('button', { name: /Auftrag anlegen/ })).toBeDisabled()

    expect(await screen.findByText('Noch keine Aufträge')).toBeInTheDocument()
  })

  it('fills the text area with the example text when the empty-state button is clicked', async () => {
    render(<App />)

    expect(await screen.findByText('Noch keine Aufträge')).toBeInTheDocument()

    const insertButton = screen.getByRole('button', { name: 'Beispieltext einfügen' })
    expect(insertButton).toBeEnabled()

    fireEvent.click(insertButton)

    expect(screen.getByLabelText('Text')).toHaveValue(EXAMPLE_TEXT)
  })
})
