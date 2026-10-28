import { ApiClientError, request } from './auth'

export type ReportParams = Record<string, string>
export type HeadcountRow = { group: string; headcount: number; onboarding: number }
export type HeadcountReport = { data: HeadcountRow[]; meta: { group_by: string; headcount: number; onboarding: number } }

export type Joiner = { id: number; employee_id: string; name: string; country: string; department: string; start_date: string }
export type JoinersPage = { data: Joiner[]; meta: { page: number; per_page: number; total: number } }

export type LeaveBalance = { leave_type: string; entitled: number; used: number; remaining: number }
export type LeaveRow = { id: number; employee_id: string; name: string; balances: LeaveBalance[]; unpaid_days: number }
export type LeaveReportPage = {
  data: LeaveRow[]
  meta: { page: number; per_page: number; total: number; year: number; totals: { balances: LeaveBalance[]; unpaid_days: number } }
}

export type PayrollTotal = {
  month: string; country: string; currency: string; employees: number; monthly_gross: string; unpaid_deduction: string; total: string
}
export type PayrollReport = { data: PayrollTotal[]; meta: { year: number } }

export type TrendSeries<T> = { values: T[] }
export type Trends = {
  months: string[]; headcount: number[]; joiners: number[]
  leave_days: (TrendSeries<number> & { leave_type: string })[]
  payroll_totals: (TrendSeries<string> & { currency: string })[] | null
}

const auth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })
const query = (params: ReportParams) => new URLSearchParams(Object.entries(params).filter(([, value]) => value !== '')).toString()

export function getHeadcount(accessToken: string, params: ReportParams): Promise<HeadcountReport> {
  return request<HeadcountReport>(`/reports/headcount?${query(params)}`, { headers: auth(accessToken) })
}

export async function downloadReport(accessToken: string, report: string, params: ReportParams): Promise<Blob> {
  const response = await fetch(`/api/v1/reports/${report}?${query({ ...params, format: 'xlsx' })}`, { credentials: 'include', headers: auth(accessToken) })
  if (!response.ok) throw new ApiClientError('request_failed', 'Could not download the report.', response.status)
  return response.blob()
}

export function getJoiners(accessToken: string, params: ReportParams, page: number): Promise<JoinersPage> {
  return request<JoinersPage>(`/reports/joiners?${query({ ...params, page: String(page) })}`, { headers: auth(accessToken) })
}

export function getLeaveReport(accessToken: string, params: ReportParams, page: number): Promise<LeaveReportPage> {
  return request<LeaveReportPage>(`/reports/leave?${query({ ...params, page: String(page) })}`, { headers: auth(accessToken) })
}

export function getPayrollReport(accessToken: string, params: ReportParams): Promise<PayrollReport> {
  return request<PayrollReport>(`/reports/payroll?${query(params)}`, { headers: auth(accessToken) })
}

export async function getTrends(accessToken: string, months = 12): Promise<Trends> {
  const { data } = await request<{ data: Trends }>(`/reports/trends?months=${months}`, { headers: auth(accessToken) })
  return data
}
