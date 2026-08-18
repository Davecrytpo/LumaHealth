import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('keeps the rest of the page available and retries', async () => {
    const onRetry = vi.fn()
    render(
      <ErrorState
        title="We couldn't load your appointments."
        body="Your other care information is still available."
        onRetry={onRetry}
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load your appointments.")
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalled()
  })
})
