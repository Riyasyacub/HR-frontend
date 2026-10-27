import { request } from './auth'

export type ManagerSummary = { id: number; employee_id: string; name: string }
export type EmployeeSummary = {
  id: number; employee_id: string; first_name: string; last_name: string; work_email: string
  country: string; currency: string; job_title: string; start_date: string; status: 'onboarding' | 'active'
  department: { id: number; name: string }
  manager?: ManagerSummary | null
}
export type CompensationComponentInput = { name: string; annual_amount: string | number }
export type CreateEmployeeInput = {
  employee_id: string; first_name: string; last_name: string; work_email: string; country: string
  department_id: number; job_title: string; start_date: string; status: 'onboarding' | 'active'
  bank_name: string; account_number: string; ifsc: string; components: CompensationComponentInput[]
}
export type EmployeeDetail = EmployeeSummary & {
  bank?: { bank_name: string; ifsc: string; account_number: string }
  compensation?: {
    id: number; effective_date: string; annual_ctc: string; currency: string
    components: { id: number; name: string; annual_amount: string }[]
  } | null
}
export type PaginatedEmployees = { data: EmployeeSummary[]; meta: { page: number; per_page: number; total: number } }

export async function listEmployees(accessToken: string, page = 1, perPage = 25): Promise<PaginatedEmployees> {
  return request<PaginatedEmployees>(`/employees?page=${page}&per_page=${perPage}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export async function createEmployee(accessToken: string, employee: CreateEmployeeInput): Promise<EmployeeDetail> {
  const { components, ...attributes } = employee
  const { data } = await request<{ data: EmployeeDetail }>('/employees', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ employee: attributes, compensation: { components } }),
  })
  return data
}

export async function getEmployee(accessToken: string, id: number): Promise<EmployeeDetail> {
  const { data } = await request<{ data: EmployeeDetail }>(`/employees/${id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data
}

export async function updateEmployeeManager(
  accessToken: string, id: number, managerId: number | null,
): Promise<EmployeeDetail> {
  return request<{ data: EmployeeDetail }>(`/employees/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ employee: { manager_id: managerId } }),
  }).then(({ data }) => data)
}

export async function getTeam(accessToken: string): Promise<EmployeeSummary[]> {
  const { data } = await request<{ data: EmployeeSummary[] }>('/employees/team', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return data
}
