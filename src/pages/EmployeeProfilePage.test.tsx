import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getEmployee,
  listEmployees,
  updateEmployeeManager,
  updateSelfContact,
} from '../api/employees'
import { listLeaveRecords } from '../api/leaves'
import { useAuth } from '../auth/AuthContext'
import EmployeeProfilePage from './EmployeeProfilePage'

vi.mock('../api/employees', () => ({
  getEmployee: vi.fn(),
  listEmployees: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployeeManager: vi.fn(),
  updateSelfContact: vi.fn(),
}))

vi.mock('../api/leaves', () => ({
  listLeaveRecords: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, per_page: 100, total: 0 } }),
  getLeaveBalances: vi.fn().mockResolvedValue([]),
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

function useHrSession() {
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
      manager: { id: 9, employee_id: 'EMP100', name: 'Arjun Patel' },
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
    expect(screen.getByTestId('current-manager')).toHaveTextContent('Arjun Patel (EMP100)')
    expect(screen.queryByRole('combobox', { name: 'Manager' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save manager' })).not.toBeInTheDocument()

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
    expect(await screen.findByRole('heading', { name: 'Leave history' })).toBeInTheDocument()
    expect(listLeaveRecords).toHaveBeenCalledWith('user-token', '', 1)
    expect(screen.getByRole('heading', { name: 'Leave balances' })).toBeInTheDocument()
  })

  it('lets the profile owner save their contact details when editable', async () => {
    const priya = {
      id: 1, employee_id: 'EMP101', first_name: 'Priya', last_name: 'Sharma', work_email: 'priya@demo.test',
      country: 'India', currency: 'INR', job_title: 'Engineer', start_date: '2026-01-01', status: 'active' as const,
      department: { id: 10, name: 'Product' }, manager: null, editable: true, phone: '+91-1',
    }
    vi.mocked(getEmployee).mockResolvedValue(priya)
    vi.mocked(updateSelfContact).mockResolvedValue({ ...priya, phone: '+91-98765-43210' })

    renderProfile('1')

    const phone = await screen.findByRole('textbox', { name: 'Phone' })
    expect(phone).toHaveValue('+91-1')
    await userEvent.clear(phone)
    await userEvent.type(phone, '+91-98765-43210')
    await userEvent.click(screen.getByRole('button', { name: 'Save contact' }))

    await waitFor(() => expect(updateSelfContact).toHaveBeenCalledWith('user-token', 1, {
      phone: '+91-98765-43210', personal_email: '', address: '', emergency_contact: '',
    }))
    expect(await screen.findByText('Contact saved.')).toBeInTheDocument()
  })

  it('hides the contact form when the profile is not editable', async () => {
    vi.mocked(getEmployee).mockResolvedValue({
      id: 1, employee_id: 'EMP101', first_name: 'Priya', last_name: 'Sharma', work_email: 'priya@demo.test',
      country: 'India', currency: 'INR', job_title: 'Engineer', start_date: '2026-01-01', status: 'active',
      department: { id: 10, name: 'Product' }, manager: null, editable: false,
    })

    renderProfile('1')

    await screen.findByRole('heading', { name: 'Priya Sharma' })
    expect(screen.queryByRole('button', { name: 'Save contact' })).not.toBeInTheDocument()
  })

  it('hides bank and compensation from a manager viewing a report', async () => {
    vi.mocked(getEmployee).mockResolvedValue({
      id: 3,
      employee_id: 'EMP104',
      first_name: 'Kavita',
      last_name: 'Rao',
      work_email: 'kavita@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Engineer',
      start_date: '2026-02-01',
      status: 'active',
      department: { id: 2, name: 'Engineering' },
    })

    renderProfile('3')

    expect(await screen.findByRole('heading', { name: 'Kavita Rao' })).toBeInTheDocument()
    expect(screen.queryByText('Bank details (read-only)')).not.toBeInTheDocument()
    expect(screen.queryByText('Compensation (read-only)')).not.toBeInTheDocument()
    expect(
      screen.getByText('Compensation and bank details are private.'),
    ).toBeInTheDocument()
  })

  it('lets HR assign a manager from the profile', async () => {
    useHrSession()
    const employee = {
      id: 2,
      employee_id: 'EMP102',
      first_name: 'Priya',
      last_name: 'Sharma',
      work_email: 'priya@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Product Manager',
      start_date: '2026-02-01',
      status: 'active' as const,
      department: { id: 10, name: 'Product' },
      manager: null,
    }
    const arjun = {
      id: 9,
      employee_id: 'EMP100',
      first_name: 'Arjun',
      last_name: 'Patel',
      work_email: 'arjun@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Engineering Manager',
      start_date: '2025-01-01',
      status: 'active' as const,
      department: { id: 10, name: 'Product' },
      manager: null,
    }
    vi.mocked(getEmployee).mockResolvedValue(employee)
    vi.mocked(listEmployees).mockResolvedValue({
      data: [employee, arjun],
      meta: { page: 1, per_page: 100, total: 2 },
    })
    vi.mocked(updateEmployeeManager).mockResolvedValue({
      ...employee,
      manager: { id: 9, employee_id: 'EMP100', name: 'Arjun Patel' },
    })

    renderProfile('2')

    expect(await screen.findByTestId('current-manager')).toHaveTextContent('No manager')
    await screen.findByRole('option', { name: 'Arjun Patel (EMP100)' })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Manager' }), '9')
    await userEvent.click(screen.getByRole('button', { name: 'Save manager' }))

    await waitFor(() =>
      expect(screen.getByTestId('current-manager')).toHaveTextContent('Arjun Patel (EMP100)'),
    )
    expect(updateEmployeeManager).toHaveBeenCalledWith('hr-token', 2, 9)
  })

  it('lets HR remove a manager from the profile', async () => {
    useHrSession()
    const arjun = {
      id: 9,
      employee_id: 'EMP100',
      first_name: 'Arjun',
      last_name: 'Patel',
      work_email: 'arjun@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Engineering Manager',
      start_date: '2025-01-01',
      status: 'active' as const,
      department: { id: 10, name: 'Product' },
      manager: null,
    }
    const employee = {
      id: 2,
      employee_id: 'EMP102',
      first_name: 'Priya',
      last_name: 'Sharma',
      work_email: 'priya@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Product Manager',
      start_date: '2026-02-01',
      status: 'active' as const,
      department: { id: 10, name: 'Product' },
      manager: { id: 9, employee_id: 'EMP100', name: 'Arjun Patel' },
    }
    vi.mocked(getEmployee).mockResolvedValue(employee)
    vi.mocked(listEmployees).mockResolvedValue({
      data: [employee, arjun],
      meta: { page: 1, per_page: 100, total: 2 },
    })
    vi.mocked(updateEmployeeManager).mockResolvedValue({ ...employee, manager: null })

    renderProfile('2')

    expect(await screen.findByTestId('current-manager')).toHaveTextContent('Arjun Patel (EMP100)')
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Manager' }), '')
    await userEvent.click(screen.getByRole('button', { name: 'Save manager' }))

    await waitFor(() =>
      expect(screen.getByTestId('current-manager')).toHaveTextContent('No manager'),
    )
    expect(updateEmployeeManager).toHaveBeenCalledWith('hr-token', 2, null)
  })

  it('shows the API error when a manager assignment is rejected', async () => {
    useHrSession()
    const employee = {
      id: 2,
      employee_id: 'EMP102',
      first_name: 'Priya',
      last_name: 'Sharma',
      work_email: 'priya@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Product Manager',
      start_date: '2026-02-01',
      status: 'active' as const,
      department: { id: 10, name: 'Product' },
      manager: null,
    }
    vi.mocked(getEmployee).mockResolvedValue(employee)
    vi.mocked(listEmployees).mockResolvedValue({
      data: [
        employee,
        {
          id: 9,
          employee_id: 'EMP100',
          first_name: 'Arjun',
          last_name: 'Patel',
          work_email: 'arjun@demo.test',
          country: 'India',
          currency: 'INR',
          job_title: 'Engineering Manager',
          start_date: '2025-01-01',
          status: 'active',
          department: { id: 10, name: 'Product' },
          manager: null,
        },
      ],
      meta: { page: 1, per_page: 100, total: 2 },
    })
    vi.mocked(updateEmployeeManager).mockRejectedValue(
      new Error('Manager creates a reporting cycle'),
    )

    renderProfile('2')

    await screen.findByRole('option', { name: 'Arjun Patel (EMP100)' })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Manager' }), '9')
    await userEvent.click(screen.getByRole('button', { name: 'Save manager' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Manager creates a reporting cycle',
    )
    expect(screen.getByRole('heading', { name: 'Priya Sharma' })).toBeInTheDocument()
  })

  it('displays error alert when access is denied or profile fails to load', async () => {
    vi.mocked(getEmployee).mockRejectedValue(new Error('You are not authorized to perform this action.'))

    renderProfile('99')

    expect(await screen.findByRole('alert')).toHaveTextContent('You are not authorized to perform this action.')
  })
})
