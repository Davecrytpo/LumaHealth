import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthResponse, SessionUser, SignInPayload, SignUpPayload } from '@shared/types'
import { json, setToken, getToken } from '@/lib/api'

interface AuthState {
  user: SessionUser | null
  loading: boolean
  signIn: (payload: SignInPayload) => Promise<SessionUser>
  signUp: (payload: SignUpPayload) => Promise<SessionUser>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (user: SessionUser | null) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const data = await json.get<{ user: SessionUser }>('/api/auth/me')
      setUser(data.user)
    } catch {
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signIn = useCallback(async (payload: SignInPayload) => {
    const data = await json.post<AuthResponse>('/api/auth/sign-in', payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const signUp = useCallback(async (payload: SignUpPayload) => {
    const data = await json.post<AuthResponse>('/api/auth/sign-up', payload)
    setToken(data.token)
    setUser(data.user)
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await json.post('/api/auth/sign-out')
    } catch {
      /* token may already be invalid */
    }
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut, refresh, setUser }),
    [user, loading, signIn, signUp, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function homeForRole(role: SessionUser['role']) {
  if (role === 'clinician') return '/doctor'
  if (role === 'admin') return '/admin'
  return '/patient'
}
