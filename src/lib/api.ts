import type { ApiErrorBody } from '@shared/types'

const TOKEN_KEY = 'lumahealth.token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json')
  }
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(path, { ...init, headers })
  if (res.status === 204) return undefined as T

  const text = await res.text()
  let data: T | ApiErrorBody | undefined
  if (text) {
    try {
      data = JSON.parse(text) as T | ApiErrorBody
    } catch {
      throw new ApiError('Something went wrong. Please try again.', res.status)
    }
  }

  if (!res.ok) {
    const body = data as ApiErrorBody | undefined
    throw new ApiError(body?.message ?? 'Something went wrong. Please try again.', res.status, body?.code)
  }
  return data as T
}

export const json = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    api<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
}
