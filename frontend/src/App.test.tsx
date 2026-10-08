import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

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
})
