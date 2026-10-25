export type User = { id: number; name: string; email: string; role: 'HR' | 'standard_employee'; country: string }
export type AuthSession = { access_token: string; token_type: 'Bearer'; expires_in: number; user: User }

export class ApiClientError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string }
    } | null
    throw new ApiClientError(
      body?.error?.code ?? 'request_failed',
      body?.error?.message ?? 'Request failed',
      response.status,
    )
  }
  return (response.status === 204 ? undefined : await response.json()) as T
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  const { data } = await request<{ data: AuthSession }>('/auth/sign_in', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return data
}

export async function currentUser(accessToken: string): Promise<User> {
  const { data } = await request<{ data: { user: User } }>('/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data.user
}

let refreshInFlight: Promise<AuthSession> | null = null

export function refreshAccessToken(): Promise<AuthSession> {
  const pending = refreshInFlight ?? request<{ data: AuthSession }>('/auth/refresh', { method: 'POST' })
    .then(({ data }) => data)
    .finally(() => { refreshInFlight = null })
  refreshInFlight = pending
  return pending
}

export async function signOut(): Promise<void> {
  await request<void>('/auth/sign_out', { method: 'DELETE' })
}
