import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'

export function renderApp(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'> & { route?: string }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[options?.route ?? '/']}>
          <AuthProvider>
            <ThemeProvider appearance="light">
              <ToastProvider>{children}</ToastProvider>
            </ThemeProvider>
          </AuthProvider>
        </MemoryRouter>
      </QueryClientProvider>
    ),
    ...options,
  })
}
