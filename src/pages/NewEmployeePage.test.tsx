import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNewEmployeeForm } from '../hooks/useNewEmployeeForm'
import NewEmployeePage from './NewEmployeePage'

vi.mock('../hooks/useNewEmployeeForm', () => ({
  useNewEmployeeForm: vi.fn(),
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/employees/new']}>
      <Routes>
        <Route path="/employees/new" element={<NewEmployeePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('NewEmployeePage', () => {
  const set = vi.fn()
  const setComponents = vi.fn()
  const handleSubmit = vi.fn(async (e: React.FormEvent) => {
    e.preventDefault()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNewEmployeeForm).mockReturnValue({
      countries: [{ name: 'India', currency: 'INR' }],
      departments: [{ id: 1, name: 'Engineering', code: 'ENG', active: true }],
      currency: 'INR',
      form: {
        employee_id: 'EMP101',
        first_name: 'Ravi',
        last_name: 'Kumar',
        work_email: 'ravi@demo.test',
        country: 'India',
        department_id: '1',
        job_title: 'Developer',
        start_date: '2026-01-01',
        status: 'active',
        bank_name: 'HDFC Bank',
        account_number: '123456',
        ifsc: 'HDFC0001',
      },
      set,
      components: [{ name: 'Basic', annual_amount: '1200000' }],
      setComponents,
      error: '',
      handleSubmit,
    })
  })

  it('renders all employee inputs and delegates submission', async () => {
    renderPage()
    const user = userEvent.setup()

    expect(screen.getByRole('heading', { name: 'New employee' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Employee ID')).toHaveValue('EMP101')
    expect(screen.getByPlaceholderText('Job title')).toHaveValue('Developer')
    expect(screen.getByPlaceholderText('First name')).toHaveValue('Ravi')
    expect(screen.getByPlaceholderText('Last name')).toHaveValue('Kumar')
    expect(screen.getByPlaceholderText('Work email')).toHaveValue('ravi@demo.test')
    expect(screen.getByLabelText('Country')).toHaveValue('India')
    expect(screen.getByLabelText('Department')).toHaveValue('1')
    expect(screen.getByLabelText('Start date')).toHaveValue('2026-01-01')
    expect(screen.getByLabelText('Status')).toHaveValue('active')
    expect(screen.getByPlaceholderText('Bank name')).toHaveValue('HDFC Bank')
    expect(screen.getByPlaceholderText('Account number')).toHaveValue('123456')
    expect(screen.getByPlaceholderText('IFSC')).toHaveValue('HDFC0001')

    await user.click(screen.getByRole('button', { name: 'Create employee' }))
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('displays error alert when an error message is present', () => {
    vi.mocked(useNewEmployeeForm).mockReturnValue({
      countries: [],
      departments: [],
      currency: 'INR',
      form: {
        employee_id: '',
        first_name: '',
        last_name: '',
        work_email: '',
        country: '',
        department_id: '',
        job_title: '',
        start_date: '',
        status: 'active',
        bank_name: '',
        account_number: '',
        ifsc: '',
      },
      set,
      components: [],
      setComponents,
      error: 'Work email has already been taken',
      handleSubmit,
    })

    renderPage()
    expect(screen.getByRole('alert')).toHaveTextContent('Work email has already been taken')
  })
})
