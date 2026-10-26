import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listEmployees } from '../api/employees'
import { useAuth } from '../auth/AuthContext'
import EmployeesPage from './EmployeesPage'

vi.mock('../api/employees', () => ({
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
  getEmployee: vi.fn(),
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
        },
      ],
      meta: { page: 1, per_page: 25, total: 1 },
    })

    renderEmployeesPage()

    expect(await screen.findByText('Employees')).toBeInTheDocument()
    expect(screen.getByText('EMP101')).toBeInTheDocument()
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument()
    expect(screen.getByText('ravi@demo.test')).toBeInTheDocument()
    expect(screen.getByText('Engineering')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
    expect(listEmployees).toHaveBeenCalledWith('hr-token')
  })

  it('shows an error state when loading employees fails', async () => {
    vi.mocked(listEmployees).mockRejectedValue(new Error('Failed to fetch'))

    renderEmployeesPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load employees.')
  })
})
