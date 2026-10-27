import { request } from './auth'

export type PayrollRun = {
  id: number; month: string; status: 'draft' | 'generated' | 'paid'
  calculation_status: 'queued' | 'processing' | 'completed' | 'failed'; calculation_error: string | null; created_at: string
}
export type PayrollRunPage = { data: PayrollRun[]; meta: { page: number; per_page: number; total: number } }

const auth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

export function listPayrollRuns(accessToken: string): Promise<PayrollRunPage> {
  return request<PayrollRunPage>('/payroll_runs', { headers: auth(accessToken) })
}

export async function createPayrollRun(accessToken: string, month: string): Promise<PayrollRun> {
  const { data } = await request<{ data: PayrollRun }>('/payroll_runs', {
    method: 'POST', headers: auth(accessToken), body: JSON.stringify({ month }),
  })
  return data
}

export type CurrencyTotal = { country: string; currency: string; employees: number; monthly_gross: string; unpaid_deduction: string; total: string }
export type PayrollRunDetail = PayrollRun & { totals: CurrencyTotal[]; blocking_issues_count: number }

export async function getPayrollRun(accessToken: string, id: number): Promise<PayrollRunDetail> {
  const { data } = await request<{ data: PayrollRunDetail }>(`/payroll_runs/${id}`, { headers: auth(accessToken) })
  return data
}

export async function recalculatePayrollRun(accessToken: string, id: number): Promise<PayrollRun> {
  const { data } = await request<{ data: PayrollRun }>(`/payroll_runs/${id}/recalculate`, { method: 'POST', headers: auth(accessToken) })
  return data
}

export type PayrollLine = {
  id: number; employee: { id: number; employee_id: string; name: string }; country: string; currency: string
  monthly_gross: string; working_days: number; unpaid_days: number; unpaid_deduction: string; total: string; blocking_issues: string[]
}
export type PayrollLinePage = { data: PayrollLine[]; meta: { page: number; per_page: number; total: number } }

export function listPayrollLines(accessToken: string, runId: number, page: number, issuesOnly: boolean): Promise<PayrollLinePage> {
  const query = new URLSearchParams({ page: String(page), ...(issuesOnly && { issues_only: 'true' }) })
  return request<PayrollLinePage>(`/payroll_runs/${runId}/lines?${query}`, { headers: auth(accessToken) })
}
