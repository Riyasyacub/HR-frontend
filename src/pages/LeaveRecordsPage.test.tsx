import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listLeaveRecords } from '../api/leaves'
import { useAuth } from '../auth/AuthContext'
import LeaveRecordsPage from './LeaveRecordsPage'

vi.mock('../api/leaves', () => ({ listLeaveRecords: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const empty = { data: [], meta: { page: 1, per_page: 100, total: 0 } }

describe('LeaveRecordsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'token', token_type: 'Bearer', expires_in: 900, user: { id: 2, name: 'Arjun Patel', email: 'arjun@demo.test', role: 'standard_employee', country: 'India' } },
      status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
    })
  })

  it('lists records with employee, date, type, reason and an unpaid flag', async () => {
    vi.mocked(listLeaveRecords).mockResolvedValue({
      data: [{ id: 1, leave_date: '2026-10-28', leave_type: 'Unpaid', reason: 'Personal work', payroll_deduction: true,
        employee: { id: 3, employee_id: 'EMP102', name: 'Priya Sharma' } }],
      meta: { page: 1, per_page: 100, total: 1 },
    })

    render(<LeaveRecordsPage />)

    expect(await screen.findByText('Priya Sharma (EMP102)')).toBeInTheDocument()
    expect(screen.getByText('2026-10-28')).toBeInTheDocument()
    expect(screen.getByText('Unpaid')).toBeInTheDocument()
    expect(screen.getByText('Personal work')).toBeInTheDocument()
    expect(screen.getByText('Payroll deduction')).toHaveAttribute('data-tone', 'warning')
    expect(listLeaveRecords).toHaveBeenCalledWith('token', '')
  })

  it('refetches when a date is picked', async () => {
    vi.mocked(listLeaveRecords).mockResolvedValue(empty)
    render(<LeaveRecordsPage />)

    await userEvent.type(screen.getByLabelText('Leave date'), '2026-10-28')

    await waitFor(() => expect(listLeaveRecords).toHaveBeenLastCalledWith('token', '2026-10-28'))
  })

  it('shows an empty state when there are no records', async () => {
    vi.mocked(listLeaveRecords).mockResolvedValue(empty)

    render(<LeaveRecordsPage />)

    expect(await screen.findByText('No leave records.')).toBeInTheDocument()
  })

  it('shows an error when loading fails', async () => {
    vi.mocked(listLeaveRecords).mockRejectedValue(new Error('boom'))

    render(<LeaveRecordsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load leave records.')
  })
})
