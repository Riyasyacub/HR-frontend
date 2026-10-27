import { render, screen, within } from '@testing-library/react'
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
import { getTeam } from './api/employees'
import {
  createDepartment,
  deactivateDepartment,
  listCountries,
  listDepartments,
  listLeaveTypes,
  renameDepartment,
  updateLeaveType,
} from './api/settings'
import { listPayrollRuns } from './api/payroll'
import { getHeadcount, getJoiners } from './api/reports'
import { AuthProvider } from './auth/AuthContext'
import App from './App'

vi.mock('./api/employees', () => ({
  createEmployee: vi.fn(),
  getEmployee: vi.fn(),
  getTeam: vi.fn(),
  listEmployees: vi.fn(),
  updateEmployeeManager: vi.fn(),
}))

vi.mock('./api/settings', () => ({
  createDepartment: vi.fn(),
  deactivateDepartment: vi.fn(),
  listCountries: vi.fn(),
  listDepartments: vi.fn(),
  listLeaveTypes: vi.fn(),
  renameDepartment: vi.fn(),
  updateLeaveType: vi.fn(),
}))

vi.mock('./api/reports', () => ({ getHeadcount: vi.fn(), getJoiners: vi.fn(), downloadReport: vi.fn() }))

vi.mock('./api/payroll', () => ({ listPayrollRuns: vi.fn() }))

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

const managerSession: AuthSession = {
  access_token: 'manager-token',
  token_type: 'Bearer',
  expires_in: 900,
  user: {
    id: 3,
    name: 'Arjun',
    email: 'arjun@demo.test',
    role: 'standard_employee',
    country: 'India',
    is_manager: true,
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
  vi.mocked(listCountries).mockResolvedValue([])
  vi.mocked(listDepartments).mockResolvedValue([])
  vi.mocked(listLeaveTypes).mockResolvedValue([])
  vi.mocked(createDepartment).mockReset()
  vi.mocked(deactivateDepartment).mockReset()
  vi.mocked(renameDepartment).mockReset()
  vi.mocked(updateLeaveType).mockReset()
  vi.mocked(getTeam).mockResolvedValue([])
  vi.mocked(getHeadcount).mockResolvedValue({ data: [], meta: { group_by: 'country', headcount: 0, onboarding: 0 } })
  vi.mocked(getJoiners).mockResolvedValue({ data: [], meta: { page: 1, per_page: 1, total: 0 } })
  vi.mocked(listPayrollRuns).mockResolvedValue({ data: [], meta: { page: 1, per_page: 25, total: 0 } })
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

  it('lands a manager on the manager dashboard with a team link', async () => {
    vi.mocked(signInRequest).mockResolvedValue(managerSession)
    renderApp('/sign-in')

    await submitCredentials('arjun@demo.test')

    expect(
      await screen.findByRole('heading', { name: 'Manager dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My team' })).toHaveAttribute('href', '/team')
  })

  it('allows a manager to open the team page', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(managerSession)
    renderApp('/team')

    expect(
      await screen.findByRole('heading', { name: 'My team' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/team')
    expect(getTeam).toHaveBeenCalledWith('manager-token')
  })

  it('redirects a non-manager away from the team page', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(employeeSession)
    renderApp('/team')

    expect(
      await screen.findByRole('heading', { name: 'Employee dashboard' }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/dashboard')
  })

  it('lets HR and managers open reports from their dashboards', async () => {
    for (const session of [hrSession, managerSession]) {
      vi.mocked(refreshAccessToken).mockResolvedValue(session)
      const { unmount } = renderApp('/dashboard')

      await userEvent.click(await screen.findByRole('link', { name: 'Reports' }))

      expect(await screen.findByRole('heading', { name: 'Reports' })).toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent('/reports')
      unmount()
    }
  })

  it('links HR to the employee list and settings from the dashboard', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    renderApp('/dashboard')

    expect(await screen.findByRole('link', { name: 'Employees' })).toHaveAttribute('href', '/employees')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })

  it('lets HR open the employee import from the dashboard and redirects an employee', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    const { unmount } = renderApp('/dashboard')

    await userEvent.click(await screen.findByRole('link', { name: 'Employee import' }))
    expect(await screen.findByRole('heading', { name: 'Employee import' })).toBeInTheDocument()
    unmount()

    vi.mocked(refreshAccessToken).mockResolvedValue(employeeSession)
    renderApp('/employee-import')
    expect(await screen.findByRole('heading', { name: 'Employee dashboard' })).toBeInTheDocument()
  })

  it('redirects an employee without reports away from reports', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(employeeSession)
    renderApp('/reports')

    expect(await screen.findByRole('heading', { name: 'Employee dashboard' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Reports' })).not.toBeInTheDocument()
    expect(screen.queryByText('Joiners this month')).not.toBeInTheDocument()
    expect(getJoiners).not.toHaveBeenCalled()
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

  it('shows the read-only country reference data to HR', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listCountries).mockResolvedValue([
      { name: 'India', currency: 'INR' },
      { name: 'USA', currency: 'USD' },
      { name: 'Canada', currency: 'CAD' },
    ])
    renderApp('/settings')

    const countries = await screen.findByRole('region', { name: 'Countries' })

    expect(await within(countries).findByText('India')).toBeInTheDocument()
    expect(within(countries).getByText('INR')).toBeInTheDocument()
    expect(within(countries).getByText('USA')).toBeInTheDocument()
    expect(within(countries).getByText('USD')).toBeInTheDocument()
    expect(within(countries).getByText('Canada')).toBeInTheDocument()
    expect(within(countries).getByText('CAD')).toBeInTheDocument()
    expect(within(countries).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(countries).queryByRole('button')).not.toBeInTheDocument()
    expect(listCountries).toHaveBeenCalledWith('hr-token')
  })

  it('shows departments to HR, including inactive departments', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listDepartments).mockResolvedValue([
      { id: 1, name: 'Engineering', code: 'ENG', active: true },
      { id: 2, name: 'Sales', code: 'SAL', active: false },
    ])
    renderApp('/settings')

    const departments = await screen.findByRole('region', {
      name: 'Departments',
    })

    expect(await within(departments).findByText('Engineering')).toBeInTheDocument()
    expect(within(departments).getByText('(ENG)')).toBeInTheDocument()
    expect(within(departments).getByText('Sales')).toBeInTheDocument()
    expect(within(departments).getByText('Inactive')).toBeInTheDocument()
  })

  it('creates a department from the settings form', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(createDepartment).mockResolvedValue({
      id: 1,
      name: 'Engineering',
      code: 'ENG',
      active: true,
    })
    renderApp('/settings')

    await screen.findByRole('region', { name: 'Departments' })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Department name'), 'Engineering')
    await user.type(screen.getByLabelText('Department code'), 'ENG')
    await user.click(screen.getByRole('button', { name: 'Add department' }))

    expect(createDepartment).toHaveBeenCalledWith(
      'hr-token',
      'Engineering',
      'ENG',
    )
    expect(await screen.findByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('(ENG)')).toBeInTheDocument()
  })

  it('shows a duplicate department error without adding a row', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(createDepartment).mockRejectedValue(
      new ApiClientError(
        'validation_failed',
        'Name has already been taken',
        422,
      ),
    )
    renderApp('/settings')

    await screen.findByRole('region', { name: 'Departments' })
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Department name'), 'Engineering')
    await user.type(screen.getByLabelText('Department code'), 'ENG')
    await user.click(screen.getByRole('button', { name: 'Add department' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Name has already been taken',
    )
    expect(screen.queryByText('Engineering')).not.toBeInTheDocument()
  })

  it('renames a department inline', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listDepartments).mockResolvedValue([
      { id: 1, name: 'Engineering', code: 'ENG', active: true },
    ])
    vi.mocked(renameDepartment).mockResolvedValue({
      id: 1,
      name: 'Product Engineering',
      code: 'ENG',
      active: true,
    })
    renderApp('/settings')

    await screen.findByText('Engineering')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Rename Engineering' }))
    const input = screen.getByLabelText('New name for Engineering')
    await user.clear(input)
    await user.type(input, 'Product Engineering')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(renameDepartment).toHaveBeenCalledWith(
      'hr-token',
      1,
      'Product Engineering',
    )
    expect(await screen.findByText('Product Engineering')).toBeInTheDocument()
  })

  it('shows a duplicate rename error and keeps the old name', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listDepartments).mockResolvedValue([
      { id: 1, name: 'Engineering', code: 'ENG', active: true },
    ])
    vi.mocked(renameDepartment).mockRejectedValue(
      new ApiClientError(
        'validation_failed',
        'Name has already been taken',
        422,
      ),
    )
    renderApp('/settings')

    await screen.findByText('Engineering')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Rename Engineering' }))
    const input = screen.getByLabelText('New name for Engineering')
    await user.clear(input)
    await user.type(input, 'Sales')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Name has already been taken',
    )
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Engineering')).toBeInTheDocument()
  })

  it('deactivates a department and removes its actions', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listDepartments).mockResolvedValue([
      { id: 1, name: 'Engineering', code: 'ENG', active: true },
    ])
    vi.mocked(deactivateDepartment).mockResolvedValue({
      id: 1,
      name: 'Engineering',
      code: 'ENG',
      active: false,
    })
    renderApp('/settings')

    await screen.findByText('Engineering')
    const user = userEvent.setup()
    await user.click(
      screen.getByRole('button', { name: 'Deactivate Engineering' }),
    )

    expect(deactivateDepartment).toHaveBeenCalledWith('hr-token', 1)
    expect(await screen.findByText('Inactive')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Deactivate Engineering' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Rename Engineering' }),
    ).not.toBeInTheDocument()
  })

  it('shows leave types and only edits balanced entitlements', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listLeaveTypes).mockResolvedValue([
      { id: 1, name: 'Earned', default_entitlement: 6, balance_tracked: true },
      { id: 4, name: 'Unpaid', default_entitlement: null, balance_tracked: false },
    ])
    renderApp('/settings')

    const leaveTypes = await screen.findByRole('region', { name: 'Leave types' })

    expect(await within(leaveTypes).findByText('Earned')).toBeInTheDocument()
    expect(
      within(leaveTypes).getByLabelText('Default entitlement for Earned'),
    ).toHaveValue(6)
    expect(within(leaveTypes).getByText('Unpaid')).toBeInTheDocument()
    expect(
      within(leaveTypes).queryByLabelText('Default entitlement for Unpaid'),
    ).not.toBeInTheDocument()
    expect(within(leaveTypes).getByText('No entitlement')).toBeInTheDocument()
  })

  it('updates a default entitlement', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listLeaveTypes).mockResolvedValue([
      { id: 1, name: 'Earned', default_entitlement: 6, balance_tracked: true },
    ])
    vi.mocked(updateLeaveType).mockResolvedValue({
      id: 1,
      name: 'Earned',
      default_entitlement: 18,
      balance_tracked: true,
    })
    renderApp('/settings')

    const input = await screen.findByLabelText('Default entitlement for Earned')
    const user = userEvent.setup()
    await user.clear(input)
    await user.type(input, '18')
    await user.click(screen.getByRole('button', { name: 'Save Earned' }))

    expect(updateLeaveType).toHaveBeenCalledWith('hr-token', 1, 18)
    expect(input).toHaveValue(18)
  })

  it('rejects a negative entitlement without calling the API', async () => {
    vi.mocked(refreshAccessToken).mockResolvedValue(hrSession)
    vi.mocked(listLeaveTypes).mockResolvedValue([
      { id: 1, name: 'Earned', default_entitlement: 6, balance_tracked: true },
    ])
    renderApp('/settings')

    const input = await screen.findByLabelText('Default entitlement for Earned')
    const user = userEvent.setup()
    await user.clear(input)
    await user.type(input, '-1')
    await user.click(screen.getByRole('button', { name: 'Save Earned' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Default entitlement must be a non-negative whole number',
    )
    expect(updateLeaveType).not.toHaveBeenCalled()
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
