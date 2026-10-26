import { act, renderHook, waitFor } from '@testing-library/react'
import type { FormEvent } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEmployee } from '../api/employees'
import { listCountries, listDepartments } from '../api/settings'
import { useAuth } from '../auth/AuthContext'
import { useNewEmployeeForm } from './useNewEmployeeForm'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('../api/employees', () => ({
  createEmployee: vi.fn(),
  listEmployees: vi.fn(),
  getEmployee: vi.fn(),
}))

vi.mock('../api/settings', () => ({
  listCountries: vi.fn(),
  listDepartments: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('useNewEmployeeForm', () => {
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
    vi.mocked(listCountries).mockResolvedValue([
      { name: 'India', currency: 'INR' },
      { name: 'Canada', currency: 'CAD' },
    ])
    vi.mocked(listDepartments).mockResolvedValue([
      { id: 10, name: 'Engineering', code: 'ENG', active: true },
      { id: 20, name: 'Old Dept', code: 'OLD', active: false },
    ])
  })

  it('loads countries and active departments on mount and derives currency', async () => {
    const { result } = renderHook(() => useNewEmployeeForm())

    await waitFor(() => {
      expect(result.current.countries).toHaveLength(2)
      expect(result.current.departments).toEqual([
        { id: 10, name: 'Engineering', code: 'ENG', active: true },
      ])
      expect(result.current.currency).toBe('INR')
    })
  })

  it('submits employee data and navigates to /employees on success', async () => {
    vi.mocked(createEmployee).mockResolvedValue({
      id: 1,
      employee_id: 'EMP101',
      first_name: 'Ravi',
      last_name: 'Kumar',
      work_email: 'ravi@demo.test',
      country: 'India',
      currency: 'INR',
      job_title: 'Developer',
      start_date: '2026-01-01',
      status: 'active',
      department: { id: 10, name: 'Engineering' },
      bank: { bank_name: 'HDFC', ifsc: 'HDFC001', account_number: '123' },
    })

    const { result } = renderHook(() => useNewEmployeeForm())

    await waitFor(() => expect(result.current.departments).toHaveLength(1))

    act(() => {
      result.current.set('employee_id', 'EMP101')
      result.current.set('first_name', 'Ravi')
      result.current.set('last_name', 'Kumar')
      result.current.set('work_email', 'ravi@demo.test')
      result.current.set('job_title', 'Developer')
      result.current.set('start_date', '2026-01-01')
      result.current.set('bank_name', 'HDFC')
      result.current.set('account_number', '123')
      result.current.set('ifsc', 'HDFC001')
      result.current.setComponents([{ name: 'Basic', annual_amount: '1200000' }])
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent)
    })

    expect(createEmployee).toHaveBeenCalledWith('hr-token', {
      employee_id: 'EMP101',
      first_name: 'Ravi',
      last_name: 'Kumar',
      work_email: 'ravi@demo.test',
      country: 'India',
      department_id: 10,
      job_title: 'Developer',
      start_date: '2026-01-01',
      status: 'active',
      bank_name: 'HDFC',
      account_number: '123',
      ifsc: 'HDFC001',
      components: [{ name: 'Basic', annual_amount: '1200000' }],
    })
    expect(mockNavigate).toHaveBeenCalledWith('/employees')
  })

  it('surfaces error message when employee creation fails', async () => {
    vi.mocked(createEmployee).mockRejectedValue(new Error('Work email has already been taken'))

    const { result } = renderHook(() => useNewEmployeeForm())
    await waitFor(() => expect(result.current.departments).toHaveLength(1))

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent)
    })

    expect(result.current.error).toBe('Work email has already been taken')
  })
})
