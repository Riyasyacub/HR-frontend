import { afterEach, describe, expect, it, vi } from 'vitest'
import { getOrgChart, getOrgChartPath } from './orgChart'

afterEach(() => vi.unstubAllGlobals())

describe('org chart api', () => {
  it('requests the top level, a manager’s reports, and a focus path', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [] }) })
    vi.stubGlobal('fetch', fetchMock)

    await getOrgChart('token')
    await getOrgChart('token', 3)
    await getOrgChartPath('token', 9)

    expect(fetchMock.mock.calls.map((call) => call[0])).toEqual([
      '/api/v1/org_chart', '/api/v1/org_chart?manager_id=3', '/api/v1/org_chart/path?employee_id=9',
    ])
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token')
  })
})
