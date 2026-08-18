import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders a primary action', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Confirm appointment →</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Confirm appointment →' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('disables while loading', () => {
    render(<Button loading>Save</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveTextContent('Working…')
  })
})
