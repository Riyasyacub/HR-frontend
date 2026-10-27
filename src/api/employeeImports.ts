import { ApiClientError, request } from './auth'

export type EmployeeImportMode = 'create' | 'update'
export type EmployeeImport = {
  id: number; mode: EmployeeImportMode; status: 'queued' | 'processing' | 'completed' | 'failed'; total_rows: number
  imported_rows: number; row_errors: { line: number; errors: string[] }[]; error_message: string | null; created_at: string
}

const auth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

export async function uploadEmployeeFile(accessToken: string, file: File, mode: EmployeeImportMode): Promise<EmployeeImport> {
  const body = new FormData()
  body.append('file', file)
  body.append('mode', mode)
  const { data } = await request<{ data: EmployeeImport }>('/employee_imports', { method: 'POST', headers: auth(accessToken), body })
  return data
}

export type ErrorsMeta = { row_errors_total: number; errors_page: number; errors_per_page: number }

export function getEmployeeImport(accessToken: string, id: number, errorsPage = 1): Promise<{ data: EmployeeImport; meta: ErrorsMeta }> {
  return request(`/employee_imports/${id}?errors_page=${errorsPage}`, { headers: auth(accessToken) })
}

export async function downloadEmployeeTemplate(accessToken: string): Promise<Blob> {
  const response = await fetch('/api/v1/employee_imports/template', { credentials: 'include', headers: auth(accessToken) })
  if (!response.ok) throw new ApiClientError('request_failed', 'Could not download the template.', response.status)
  return response.blob()
}
