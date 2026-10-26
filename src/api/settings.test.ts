import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createDepartment,
  deactivateDepartment,
  listCountries,
  listDepartments,
  listLeaveTypes,
  renameDepartment,
  updateLeaveType,
} from './settings'

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

describe('settings API', () => {
  it('lists departments with the HR bearer token', async () => {
    const departments = [
      { id: 1, name: 'Engineering', code: 'ENG', active: true },
    ]
    const fetchMock = mockFetch(response({ data: departments }))

    await expect(listDepartments('hr-token')).resolves.toEqual(departments)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/settings/departments',
      expect.objectContaining({ credentials: 'include' }),
    )
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer hr-token')
  })

  it('creates a department with name and code', async () => {
    const department = { id: 1, name: 'Engineering', code: 'ENG', active: true }
    const fetchMock = mockFetch(response({ data: department }, 201))

    await expect(
      createDepartment('hr-token', 'Engineering', 'ENG'),
    ).resolves.toEqual(department)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/settings/departments',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ department: { name: 'Engineering', code: 'ENG' } }),
      }),
    )
  })

  it('renames a department', async () => {
    const department = { id: 1, name: 'Product', code: 'ENG', active: true }
    const fetchMock = mockFetch(response({ data: department }))

    await expect(renameDepartment('hr-token', 1, 'Product')).resolves.toEqual(
      department,
    )

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/settings/departments/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ department: { name: 'Product' } }),
      }),
    )
  })

  it('deactivates a department', async () => {
    const department = { id: 1, name: 'Engineering', code: 'ENG', active: false }
    const fetchMock = mockFetch(response({ data: department }))

    await expect(deactivateDepartment('hr-token', 1)).resolves.toEqual(department)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/settings/departments/1/deactivate',
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('lists leave types with the HR bearer token', async () => {
    const leaveTypes = [
      { id: 1, name: 'Earned', default_entitlement: 6, balance_tracked: true },
      { id: 4, name: 'Unpaid', default_entitlement: null, balance_tracked: false },
    ]
    const fetchMock = mockFetch(response({ data: leaveTypes }))

    await expect(listLeaveTypes('hr-token')).resolves.toEqual(leaveTypes)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/settings/leave_types',
      expect.objectContaining({ credentials: 'include' }),
    )
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer hr-token')
  })

  it('updates a leave type entitlement', async () => {
    const leaveType = {
      id: 1,
      name: 'Earned',
      default_entitlement: 18,
      balance_tracked: true,
    }
    const fetchMock = mockFetch(response({ data: leaveType }))

    await expect(updateLeaveType('hr-token', 1, 18)).resolves.toEqual(leaveType)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/settings/leave_types/1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ leave_type: { default_entitlement: 18 } }),
      }),
    )
  })

  it('lists countries with the HR bearer token', async () => {
    const countries = [
      { name: 'India', currency: 'INR' },
      { name: 'USA', currency: 'USD' },
      { name: 'Canada', currency: 'CAD' },
    ]
    const fetchMock = mockFetch(response({ data: countries }))

    await expect(listCountries('hr-token')).resolves.toEqual(countries)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/settings/countries',
      expect.objectContaining({ credentials: 'include' }),
    )
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer hr-token')
  })
})
