import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadReport, getHeadcount, getJoiners, getLeaveReport, getPayrollReport } from './reports'

afterEach(() => vi.unstubAllGlobals())

describe('reports api', () => {
  it('requests headcount with the grouping and non-empty filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [], meta: {} }) })
    vi.stubGlobal('fetch', fetchMock)

    await getHeadcount('token', { group_by: 'country', country: 'India', department_id: '' })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/headcount?group_by=country&country=India')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token')
  })

  it('downloads a report as XLSX with the same filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(['xlsx']) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(downloadReport('token', 'joiners', { from: '2026-11-01', country: '' })).resolves.toBeInstanceOf(Blob)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/joiners?from=2026-11-01&format=xlsx')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token')
  })

  it('requests joiners for a period, filters and page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [], meta: {} }) })
    vi.stubGlobal('fetch', fetchMock)

    await getJoiners('token', { from: '2026-11-01', to: '2026-11-30', country: '' }, 2)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/joiners?from=2026-11-01&to=2026-11-30&page=2')
  })

  it('requests the leave report for a year, filters and page', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [], meta: {} }) })
    vi.stubGlobal('fetch', fetchMock)

    await getLeaveReport('token', { year: '2026', country: 'India' }, 3)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/leave?year=2026&country=India&page=3')
  })

  it('requests payroll totals for a year and country', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [], meta: {} }) })
    vi.stubGlobal('fetch', fetchMock)

    await getPayrollReport('token', { year: '2026', country: 'USA' })

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/reports/payroll?year=2026&country=USA')
  })
})
