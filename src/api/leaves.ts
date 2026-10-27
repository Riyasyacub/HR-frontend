import { ApiClientError, request } from './auth'

export type LeaveImport = {
  id: number; status: 'queued' | 'processing' | 'completed' | 'failed'; total_rows: number; imported_rows: number
  row_errors: { line: number; errors: string[] }[]; error_message: string | null; created_at: string
}

const auth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

export async function uploadLeaveFile(accessToken: string, file: File): Promise<LeaveImport> {
  const body = new FormData()
  body.append('file', file)
  const { data } = await request<{ data: LeaveImport }>('/leave_imports', { method: 'POST', headers: auth(accessToken), body })
  return data
}

export async function getLeaveImport(accessToken: string, id: number): Promise<LeaveImport> {
  const { data } = await request<{ data: LeaveImport }>(`/leave_imports/${id}`, { headers: auth(accessToken) })
  return data
}

export async function downloadLeaveTemplate(accessToken: string): Promise<Blob> {
  const response = await fetch('/api/v1/leave_imports/template', { credentials: 'include', headers: auth(accessToken) })
  if (!response.ok) throw new ApiClientError('request_failed', 'Could not download the template.', response.status)
  return response.blob()
}

export type LeaveRecord = {
  id: number; leave_date: string; leave_type: string; reason: string | null; payroll_deduction: boolean
  employee: { id: number; employee_id: string; name: string }
}
export type LeaveRecordPage = { data: LeaveRecord[]; meta: { page: number; per_page: number; total: number } }

export function listLeaveRecords(accessToken: string, leaveDate: string, employeeId?: number): Promise<LeaveRecordPage> {
  const filter = (leaveDate ? `&leave_date=${encodeURIComponent(leaveDate)}` : '') + (employeeId ? `&employee_id=${employeeId}` : '')
  return request<LeaveRecordPage>(`/leave_records?per_page=100${filter}`, { headers: auth(accessToken) })
}

export type LeaveBalance = { leave_type: string; entitled: number; used: number; remaining: number }

export async function getLeaveBalances(accessToken: string, employeeId: number): Promise<LeaveBalance[]> {
  const { data } = await request<{ data: LeaveBalance[] }>(`/employees/${employeeId}/leave_balances`, { headers: auth(accessToken) })
  return data
}
