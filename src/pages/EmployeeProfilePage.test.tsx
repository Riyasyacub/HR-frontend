import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getEmployee } from '../api/employees'
import { useAuth } from '../auth/AuthContext'
import EmployeeProfilePage from './EmployeeProfilePage'

vi.mock('../api/employees', () => ({
  getEmployee: vi.fn(),
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

function renderProfile(id = '1') {
  return render(
    <MemoryRouter initialEntries={[`/employees/${id}`]}>
      <Routes>
        <Route path="/employees/:id" element={<EmployeeProfilePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EmployeeProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: {
        access_token: 'user-token',
        token_type: 'Bearer',
        expires_in: 900,
        user: { id: 2, name: 'Priya Sharma', email: 'priya@demo.test', role: 'standard_employee', country: 'India' },
      },
      status: 'authenticated',
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('renders the employee profile with read-only bank and compensation details', async () => {
    vi.mocked(getEmployee).mockResolvedValue({
      id: 1,
      employee_id: 'EMP101',
      first_name: 'Priya',
      last_name: 'Sharma',
      work_email: 'priya@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Product Manager',
      start_date: '2026-01-01',
      status: 'active',
      department: { id: 10, name: 'Product' },
      bank: { bank_name: 'HDFC Bank', ifsc: 'HDFC0001', account_number: '987654321' },
      compensation: {
        id: 5,
        effective_date: '2026-01-01',
        annual_ctc: '1500000.00',
        currency: 'INR',
        components: [
          { id: 11, name: 'Basic', annual_amount: '1000000.00' },
          { id: 12, name: 'Allowance', annual_amount: '500000.00' },
        ],
      },
    })

    renderProfile('1')

    expect(await screen.findByRole('heading', { name: 'Priya Sharma' })).toBeInTheDocument()
    expect(screen.getByText('EMP101')).toBeInTheDocument()
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()

    // Bank details (read-only)
    expect(screen.getByText('HDFC Bank')).toBeInTheDocument()
    expect(screen.getByText('987654321')).toBeInTheDocument()
    expect(screen.getByText('HDFC0001')).toBeInTheDocument()

    // Compensation details (read-only)
    expect(screen.getByText('1500000.00 INR')).toBeInTheDocument()
    expect(screen.getByText('Basic')).toBeInTheDocument()
    expect(screen.getByText('1000000.00 INR')).toBeInTheDocument()
    expect(screen.getByText('Allowance')).toBeInTheDocument()
    expect(screen.getByText('500000.00 INR')).toBeInTheDocument()

    // Confirm no editable inputs for bank or CTC
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(getEmployee).toHaveBeenCalledWith('user-token', 1)
  })

  it('displays error alert when access is denied or profile fails to load', async () => {
    vi.mocked(getEmployee).mockRejectedValue(new Error('You are not authorized to perform this action.'))

    renderProfile('99')

    expect(await screen.findByRole('alert')).toHaveTextContent('You are not authorized to perform this action.')
  })
})
