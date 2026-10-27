import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../auth/AuthContext'
import ReportsPage from './ReportsPage'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))
vi.mock('../components/reports/HeadcountReport', () => ({ default: () => <p>headcount report</p> }))
vi.mock('../components/reports/JoinersReport', () => ({ default: () => <p>joiners report</p> }))
vi.mock('../components/reports/LeaveReport', () => ({ default: () => <p>leave report</p> }))
vi.mock('../components/reports/PayrollReport', () => ({ default: () => <p>payroll report</p> }))

function signInAs(role: 'HR' | 'standard_employee', isManager = false) {
  vi.mocked(useAuth).mockReturnValue({
    session: { access_token: 'token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'User', email: 'u@demo.test', role, country: 'India', is_manager: isManager } },
    status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
  })
}

describe('ReportsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows headcount first and switches between tabs', async () => {
    signInAs('HR')
    render(<ReportsPage />)

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument()
    expect(screen.getByText('headcount report')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Joiners' }))
    expect(screen.getByText('joiners report')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))
    expect(screen.getByText('leave report')).toBeInTheDocument()
  })

  it('offers the payroll tab to HR only', async () => {
    signInAs('HR')
    const { unmount } = render(<ReportsPage />)
    await userEvent.click(screen.getByRole('button', { name: 'Payroll' }))
    expect(screen.getByText('payroll report')).toBeInTheDocument()
    unmount()

    signInAs('standard_employee', true)
    render(<ReportsPage />)
    expect(screen.queryByRole('button', { name: 'Payroll' })).not.toBeInTheDocument()
  })
})
