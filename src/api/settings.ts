import { request } from './auth'

export type Country = { name: string; currency: string }
export type Department = { id: number; name: string; code: string; active: boolean }
export type LeaveType = { id: number; name: string; default_entitlement: number | null; balance_tracked: boolean }

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` }
}

export async function listCountries(accessToken: string): Promise<Country[]> {
  const { data } = await request<{ data: Country[] }>('/settings/countries', {
    headers: authHeaders(accessToken),
  })
  return data
}

export async function listDepartments(accessToken: string): Promise<Department[]> {
  const { data } = await request<{ data: Department[] }>('/settings/departments', {
    headers: authHeaders(accessToken),
  })
  return data
}

export async function createDepartment(accessToken: string, name: string, code: string): Promise<Department> {
  const { data } = await request<{ data: Department }>('/settings/departments', {
    method: 'POST',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ department: { name, code } }),
  })
  return data
}

export async function renameDepartment(accessToken: string, id: number, name: string): Promise<Department> {
  const { data } = await request<{ data: Department }>(`/settings/departments/${id}`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify({ department: { name } }),
  })
  return data
}

export async function deactivateDepartment(accessToken: string, id: number): Promise<Department> {
  const { data } = await request<{ data: Department }>(`/settings/departments/${id}/deactivate`, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
  })
  return data
}

export async function listLeaveTypes(accessToken: string): Promise<LeaveType[]> {
  return (await request<{ data: LeaveType[] }>('/settings/leave_types', { headers: authHeaders(accessToken) })).data
}

export async function updateLeaveType(accessToken: string, id: number, defaultEntitlement: number): Promise<LeaveType> {
  const { data } = await request<{ data: LeaveType }>(`/settings/leave_types/${id}`, { method: 'PATCH', headers: authHeaders(accessToken), body: JSON.stringify({ leave_type: { default_entitlement: defaultEntitlement } }) })
  return data
}
