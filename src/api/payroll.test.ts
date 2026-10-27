import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPayrollRun, downloadPayrollExport, generatePayrollRun, getPayrollRun, listPayrollLines, listPayrollRuns, markPayrollRunPaid, recalculatePayrollRun } from './payroll'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status, json: async () => body })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('payroll api', () => {
  it('creates a run for a month', async () => {
    const fetchMock = stubFetch({ data: { id: 4 } }, 202)

    await expect(createPayrollRun('token', '2026-11')).resolves.toEqual({ id: 4 })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/payroll_runs')
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ month: '2026-11' }) })
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token')
  })

  it('lists runs with the bearer token', async () => {
    const fetchMock = stubFetch({ data: [], meta: { page: 1, per_page: 25, total: 0 } })

    await listPayrollRuns('token')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/payroll_runs')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token')
  })

  it('fetches a run and recalculates it', async () => {
    const fetchMock = stubFetch({ data: { id: 4 } })

    await getPayrollRun('token', 4)
    await recalculatePayrollRun('token', 4)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/payroll_runs/4')
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/payroll_runs/4/recalculate')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST' })
  })

  it('lists lines for a page with the issues-only filter', async () => {
    const fetchMock = stubFetch({ data: [], meta: { page: 2, per_page: 25, total: 30 } })

    await listPayrollLines('token', 4, 2, true)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/payroll_runs/4/lines?page=2&issues_only=true')
  })

  it('generates a run and marks it paid on a date', async () => {
    const fetchMock = stubFetch({ data: { id: 4 } })

    await generatePayrollRun('token', 4)
    await markPayrollRunPaid('token', 4, '2026-12-01')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/payroll_runs/4/generate')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' })
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/payroll_runs/4/mark_paid')
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ paid_on: '2026-12-01' }) })
  })

  it('downloads the export with the bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(['xlsx']) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(downloadPayrollExport('token', 4)).resolves.toBeInstanceOf(Blob)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/payroll_runs/4/export')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token')
  })
})
