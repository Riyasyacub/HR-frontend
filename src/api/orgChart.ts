import { request } from './auth'

export type OrgNode = { id: number; employee_id: string; name: string; job_title: string; department: string; reports_count: number }

const auth = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` })

export async function getOrgChart(accessToken: string, managerId?: number): Promise<OrgNode[]> {
  const query = managerId === undefined ? '' : `?manager_id=${managerId}`
  const { data } = await request<{ data: OrgNode[] }>(`/org_chart${query}`, { headers: auth(accessToken) })
  return data
}

export async function getOrgChartPath(accessToken: string, employeeId: number): Promise<OrgNode[]> {
  const { data } = await request<{ data: OrgNode[] }>(`/org_chart/path?employee_id=${employeeId}`, { headers: auth(accessToken) })
  return data
}
