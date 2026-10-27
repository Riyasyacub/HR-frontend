import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listEmployees } from '../api/employees'
import { listDepartments } from '../api/settings'
import { useAuth } from '../auth/AuthContext'
import EmployeesPage from './EmployeesPage'

vi.mock('../api/employees', () => ({
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
  getEmployee: vi.fn(),
}))

vi.mock('../api/settings', () => ({
  listDepartments: vi.fn(),
  listCountries: vi.fn(),
  createDepartment: vi.fn(),
  renameDepartment: vi.fn(),
  deactivateDepartment: vi.fn(),
  updateLeaveTypeEntitlement: vi.fn(),
  listLeaveTypes: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

function renderEmployeesPage() {
  return render(
    <MemoryRouter initialEntries={['/employees']}>
      <Routes>
        <Route path="/employees" element={<EmployeesPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EmployeesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: {
        access_token: 'hr-token',
        token_type: 'Bearer',
        expires_in: 900,
        user: { id: 1, name: 'HR Admin', email: 'hr@demo.test', role: 'HR', country: 'India' },
      },
      status: 'authenticated',
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
    vi.mocked(listDepartments).mockResolvedValue([])
  })

  it('renders the employees list for HR users', async () => {
    vi.mocked(listEmployees).mockResolvedValue({
      data: [
        {
          id: 1,
          employee_id: 'EMP101',
          first_name: 'Ravi',
          last_name: 'Kumar',
          work_email: 'ravi@demo.test',
          country: 'India',
          currency: 'INR',
          job_title: 'Software Engineer',
          start_date: '2026-01-01',
          status: 'active',
          department: { id: 10, name: 'Engineering' },
          manager: { id: 9, employee_id: 'EMP100', name: 'Arjun Patel' },
        },
        {
          id: 2,
          employee_id: 'EMP102',
          first_name: 'Priya',
          last_name: 'Sharma',
          work_email: 'priya@demo.test',
          country: 'India',
          currency: 'INR',
          job_title: 'Product Manager',
          start_date: '2026-02-01',
          status: 'active',
          department: { id: 10, name: 'Engineering' },
          manager: null,
        },
      ],
      meta: { page: 1, per_page: 25, total: 2 },
    })

    renderEmployeesPage()

    expect(await screen.findByText('Employees')).toBeInTheDocument()
    expect(screen.getByText('EMP101')).toBeInTheDocument()
    expect(screen.getByText('ravi@demo.test')).toBeInTheDocument()
    expect(screen.getAllByText('Engineering')).toHaveLength(2)
    expect(screen.getByText('Arjun Patel')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
    expect(listEmployees).toHaveBeenCalledWith('hr-token', 1, 100, '')
  })

  it('loads only managers into the manager filter', async () => {
    vi.mocked(listEmployees).mockResolvedValue({ data: [], meta: { page: 1, per_page: 25, total: 0 } })

    renderEmployeesPage()

    await screen.findByRole('combobox', { name: 'Manager' })
    expect(listEmployees).toHaveBeenCalledWith('hr-token', 1, 100, 'managers_only=true')
  })

  it('refetches the directory filtered by country and status', async () => {
    vi.mocked(listEmployees).mockResolvedValue({ data: [], meta: { page: 1, per_page: 25, total: 0 } })

    renderEmployeesPage()

    await userEvent.type(screen.getByRole('textbox', { name: 'Country' }), 'USA')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'active')

    await waitFor(() => expect(listEmployees).toHaveBeenLastCalledWith('hr-token', 1, 100, 'country=USA&status=active'))
  })

  it('shows an error state when loading employees fails', async () => {
    vi.mocked(listEmployees).mockRejectedValue(new Error('Failed to fetch'))

    renderEmployeesPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load employees.')
  })
})
