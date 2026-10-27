import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createEmployee,
  getEmployee,
  getTeam,
  listEmployees,
  updateEmployeeManager,
  type CreateEmployeeInput,
} from './employees'

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response
}

function mockFetch(result: Response) {
  const fetchMock = vi.fn().mockResolvedValue(result)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('employees API', () => {
  it('lists employees with offset pagination and authorization header', async () => {
    const listPayload = {
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
    }
    const fetchMock = mockFetch(response(listPayload))

    const result = await listEmployees('hr-token', 1, 25)
    expect(result).toEqual(listPayload)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/employees?page=1&per_page=25',
      expect.objectContaining({ credentials: 'include' }),
    )
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer hr-token')
  })

  it('creates an employee with nested compensation components', async () => {
    const createdEmployee = {
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
      compensation: {
        id: 20,
        effective_date: '2026-02-01',
        annual_ctc: '1500000.00',
        currency: 'INR',
        components: [{ id: 30, name: 'Basic', annual_amount: '1500000.00' }],
      },
    }
    const fetchMock = mockFetch(response({ data: createdEmployee }, 201))

    const payload: CreateEmployeeInput = {
      employee_id: 'EMP102',
      first_name: 'Priya',
      last_name: 'Sharma',
      work_email: 'priya@demo.test',
      country: 'India',
      department_id: 10,
      job_title: 'Product Manager',
      start_date: '2026-02-01',
      status: 'active',
      bank_name: 'HDFC Bank',
      account_number: '987654321',
      ifsc: 'HDFC0001234',
      components: [{ name: 'Basic', annual_amount: '1500000.00' }],
    }

    const result = await createEmployee('hr-token', payload)
    expect(result).toEqual(createdEmployee)

    const { components, ...employeeAttributes } = payload
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/employees',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          employee: employeeAttributes,
          compensation: { components },
        }),
      }),
    )
  })

  it('updates an employee manager and can remove it', async () => {
    const updated = {
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
      manager: { id: 1, employee_id: 'EMP101', name: 'Arjun Patel' },
    }
    const fetchMock = mockFetch(response({ data: updated }))

    const result = await updateEmployeeManager('hr-token', 2, 1)
    expect(result).toEqual(updated)
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/v1/employees/2',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ employee: { manager_id: 1 } }),
      }),
    )

    await updateEmployeeManager('hr-token', 2, null)
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/employees/2',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ employee: { manager_id: null } }),
      }),
    )
  })

  it('fetches an employee profile with bank and compensation details', async () => {
    const profile = {
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
      bank: { bank_name: 'HDFC Bank', ifsc: 'HDFC0001234', account_number: '123456789012' },
      compensation: {
        id: 10,
        effective_date: '2026-01-01',
        annual_ctc: '1200000.00',
        currency: 'INR',
        components: [{ id: 100, name: 'Basic', annual_amount: '1200000.00' }],
      },
    }
    const fetchMock = mockFetch(response({ data: profile }))

    const result = await getEmployee('user-token', 1)
    expect(result).toEqual(profile)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/employees/1',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('fetches manager team subtree via getTeam', async () => {
    const team = [
      {
        id: 2,
        employee_id: 'EMP102',
        first_name: 'Priya',
        last_name: 'Sharma',
        work_email: 'priya@demo.test',
        country: 'India',
        currency: 'INR',
        job_title: 'Software Engineer',
        start_date: '2026-01-01',
        status: 'active' as const,
        department: { id: 10, name: 'Engineering' },
      },
    ]
    const fetchMock = mockFetch(response({ data: team }))

    const result = await getTeam('manager-token')
    expect(result).toEqual(team)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/employees/team',
      expect.objectContaining({ credentials: 'include' }),
    )
  })
})
