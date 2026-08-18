import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LandingPage } from './LandingPage'
import { renderApp } from '@/test/render'

describe('LandingPage', () => {
  it('renders the hero and primary sections', () => {
    renderApp(<LandingPage />)
    expect(screen.getByRole('heading', { name: /Healthcare that/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Book an appointment/ })).toBeInTheDocument()
    expect(screen.getByText('Your next step starts here.')).toBeInTheDocument()
  })
})
