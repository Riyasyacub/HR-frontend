import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiClientError,
  currentUser,
  refreshAccessToken,
  signIn,
  signOut,
  type AuthSession,
  type User,
} from './auth'

const user: User = {
  id: 1,
  name: 'HR Admin',
  email: 'hr@demo.test',
  role: 'HR',
  country: 'India',
}

const session: AuthSession = {
  access_token: 'access-token',
  token_type: 'Bearer',
  expires_in: 900,
  user,
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function mockFetch(result: Response) {
  const fetchMock = vi.fn().mockResolvedValue(result)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function requestHeaders(fetchMock: ReturnType<typeof vi.fn>) {
  return (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('auth API', () => {
  it('signs in with cookies enabled and returns the session', async () => {
    const fetchMock = mockFetch(response({ data: session }))

    await expect(signIn('hr@demo.test', 'Demo@1234')).resolves.toEqual(session)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/sign_in',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          email: 'hr@demo.test',
          password: 'Demo@1234',
        }),
      }),
    )
    expect(requestHeaders(fetchMock).get('Content-Type')).toBe('application/json')
  })

  it('loads the current user with a bearer token', async () => {
    const fetchMock = mockFetch(response({ data: { user } }))

    await expect(currentUser('access-token')).resolves.toEqual(user)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/me',
      expect.objectContaining({ credentials: 'include' }),
    )
    expect(requestHeaders(fetchMock).get('Authorization')).toBe(
      'Bearer access-token',
    )
  })

  it('refreshes the session using the refresh cookie', async () => {
    const fetchMock = mockFetch(response({ data: session }))

    await expect(refreshAccessToken()).resolves.toEqual(session)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
      }),
    )
  })

  it('shares one refresh request across concurrent calls', async () => {
    let resolveFetch!: (value: Response) => void
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    const fetchMock = vi.fn().mockReturnValue(pending)
    vi.stubGlobal('fetch', fetchMock)

    const first = refreshAccessToken()
    const second = refreshAccessToken()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    resolveFetch(response({ data: session }))
    await expect(Promise.all([first, second])).resolves.toEqual([
      session,
      session,
    ])
  })

  it('signs out without parsing an empty response', async () => {
    const result = response(undefined, 204)
    const fetchMock = mockFetch(result)

    await expect(signOut()).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/sign_out',
      expect.objectContaining({
        method: 'DELETE',
        credentials: 'include',
      }),
    )
    expect(result.json).not.toHaveBeenCalled()
  })

  it('raises an ApiClientError with the backend error envelope', async () => {
    mockFetch(
      response(
        {
          error: {
            code: 'invalid_credentials',
            message: 'Invalid email or password',
            details: [],
          },
        },
        401,
      ),
    )

    const request = signIn('hr@demo.test', 'wrong-password')

    await expect(request).rejects.toBeInstanceOf(ApiClientError)
    await expect(request).rejects.toMatchObject({
      code: 'invalid_credentials',
      message: 'Invalid email or password',
      status: 401,
    })
  })

  it('falls back to a generic error when the response is not JSON', async () => {
    const result = response(undefined, 500)
    vi.mocked(result.json).mockRejectedValue(new SyntaxError('not json'))
    mockFetch(result)

    await expect(signIn('hr@demo.test', 'Demo@1234')).rejects.toMatchObject({
      code: 'request_failed',
      message: 'Request failed',
      status: 500,
    })
  })
})
