import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  refreshAccessToken,
  signIn as signInRequest,
  signOut as signOutRequest,
  type AuthSession,
} from '../api/auth'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../api/auth')

const session: AuthSession = {
  access_token: 'access-token',
  token_type: 'Bearer',
  expires_in: 900,
  user: {
    id: 1,
    name: 'HR Admin',
    email: 'hr@demo.test',
    role: 'HR',
    country: 'India',
  },
}

function Consumer() {
  const { session, signIn, signOut, status } = useAuth()

  return (
    <div>
      <p>{status}</p>
      <p>{session?.user.email ?? 'signed out'}</p>
      <p>{session?.access_token ?? 'no token'}</p>
      <button onClick={() => void signIn('hr@demo.test', 'Demo@1234')}>
        Sign in
      </button>
      <button onClick={() => void signOut().catch(() => undefined)}>
        Sign out
      </button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(refreshAccessToken).mockRejectedValue(new Error('no session'))
})

describe('AuthProvider', () => {
  it('shows loading, then no session when refresh fails', async () => {
    renderProvider()

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('unauthenticated')).toBeInTheDocument()
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(screen.getByText('no token')).toBeInTheDocument()
  })

  it('restores the session from the refresh cookie', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(session)
    renderProvider()

    expect(screen.getByText('loading')).toBeInTheDocument()
    expect(await screen.findByText('hr@demo.test')).toBeInTheDocument()
    expect(screen.getByText('authenticated')).toBeInTheDocument()
    expect(screen.getByText('access-token')).toBeInTheDocument()
    expect(refreshAccessToken).toHaveBeenCalledTimes(1)
  })

  it('stores the session after signing in', async () => {
    vi.mocked(signInRequest).mockResolvedValue(session)
    const user = userEvent.setup()
    renderProvider()
    await screen.findByText('unauthenticated')

    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('hr@demo.test')).toBeInTheDocument()
    expect(screen.getByText('authenticated')).toBeInTheDocument()
    expect(screen.getByText('access-token')).toBeInTheDocument()
    expect(signInRequest).toHaveBeenCalledWith('hr@demo.test', 'Demo@1234')
  })

  it('clears the session after signing out', async () => {
    vi.mocked(signInRequest).mockResolvedValue(session)
    vi.mocked(signOutRequest).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderProvider()
    await screen.findByText('unauthenticated')

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await screen.findByText('hr@demo.test')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(await screen.findByText('unauthenticated')).toBeInTheDocument()
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(screen.getByText('no token')).toBeInTheDocument()
    expect(signOutRequest).toHaveBeenCalled()
  })

  it('clears the local session when signing out fails', async () => {
    vi.mocked(signInRequest).mockResolvedValue(session)
    vi.mocked(signOutRequest).mockRejectedValue(new Error('offline'))
    const user = userEvent.setup()
    renderProvider()
    await screen.findByText('unauthenticated')

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await screen.findByText('hr@demo.test')
    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    await waitFor(() => {
      expect(screen.getByText('unauthenticated')).toBeInTheDocument()
    })
    expect(screen.getByText('signed out')).toBeInTheDocument()
    expect(screen.getByText('no token')).toBeInTheDocument()
  })
})
