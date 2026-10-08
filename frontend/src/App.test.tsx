import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App shell', () => {
  it('renders the app shell with the header, the disabled form and the empty job area', () => {
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

    expect(screen.getByText('Noch keine Aufträge')).toBeInTheDocument()
  })
})
