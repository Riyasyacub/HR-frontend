import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiClientError,
  refreshAccessToken,
  signIn as signInRequest,
  signOut as signOutRequest,
  type AuthSession,
} from './api/auth'
import { AuthProvider } from './auth/AuthContext'
import App from './App'

vi.mock('./api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./api/auth')>()
  return {
    ...actual,
    refreshAccessToken: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }
})

const hrSession: AuthSession = {
  access_token: 'hr-token',
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

const employeeSession: AuthSession = {
  access_token: 'employee-token',
  token_type: 'Bearer',
  expires_in: 900,
  user: {
    id: 2,
    name: 'Priya',
    email: 'priya@demo.test',
    role: 'standard_employee',
    country: 'India',
  },
}

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>
}

function BackButton() {
  const navigate = useNavigate()
  return <button onClick={() => navigate(-1)}>Back</button>
}

function renderApp(initialEntry = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <App />
        <LocationProbe />
        <BackButton />
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function submitCredentials(email: string, password = 'Demo@1234') {
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'Sign in' })
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Sign in' }))
  return user
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(refreshAccessToken).mockRejectedValue(new Error('no session'))
})

describe('App', () => {
  it('redirects an unauthenticated dashboard visit to sign-in', async () => {
    renderApp()

    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/sign-in')
  })

  it('lands an HR user on the HR dashboard', async () => {
    vi.mocked(signInRequest).mockResolvedValue(hrSession)
    renderApp('/sign-in')

    await submitCredentials('hr@demo.test')

    expect(
      await screen.findByRole('heading', { name: 'HR dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
    expect(signInRequest).toHaveBeenCalledWith('hr@demo.test', 'Demo@1234')
  })

  it('lands an employee on the employee dashboard', async () => {
    vi.mocked(signInRequest).mockResolvedValue(employeeSession)
    renderApp('/sign-in')

    await submitCredentials('priya@demo.test')

    expect(
      await screen.findByRole('heading', { name: 'Employee dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
  })

  it('shows the generic error for invalid credentials', async () => {
    vi.mocked(signInRequest).mockRejectedValue(
      new ApiClientError(
        'invalid_credentials',
        'Invalid email or password',
        401,
      ),
    )
    renderApp('/sign-in')

    await submitCredentials('hr@demo.test', 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid email or password',
    )
    expect(screen.getByTestId('location')).toHaveTextContent('/sign-in')
  })

  it('allows HR to open settings', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    renderApp('/settings')

    expect(
      await screen.findByRole('heading', { name: 'HR settings' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/settings')
  })

  it('denies an employee direct access to settings', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(employeeSession)
    renderApp('/settings')

    expect(
      await screen.findByRole('heading', { name: 'Employee dashboard' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'HR settings' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
  })

  it('keeps the user signed out after logout and browser back', async () => {
    vi.mocked(signInRequest).mockResolvedValue(hrSession)
    vi.mocked(signOutRequest).mockResolvedValue(undefined)
    renderApp('/sign-in')

    await submitCredentials('hr@demo.test')
    await screen.findByRole('heading', { name: 'HR dashboard' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await screen.findByRole('heading', { name: 'Sign in' })

    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'HR dashboard' }),
    ).not.toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/sign-in')
  })

  it('signs out and returns to the sign-in page', async () => {
    vi.mocked(signInRequest).mockResolvedValue(hrSession)
    vi.mocked(signOutRequest).mockResolvedValue(undefined)
    renderApp('/sign-in')

    await submitCredentials('hr@demo.test')
    await screen.findByRole('heading', { name: 'HR dashboard' })
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Sign out' }))

    expect(
      await screen.findByRole('heading', { name: 'Sign in' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/sign-in')
    expect(signOutRequest).toHaveBeenCalled()
  })
})
