import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SignInPage } from './SignInPage'
import { renderApp } from '@/test/render'

describe('SignInPage', () => {
  it('shows the editorial welcome and a labelled form', () => {
    renderApp(<SignInPage />, { route: '/sign-in' })
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeInTheDocument()
    expect(screen.getByText('Your care is waiting when you are.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
})
