import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadLeaveTemplate, getLeaveBalances, listLeaveRecords, uploadLeaveFile } from './leaves'

afterEach(() => vi.unstubAllGlobals())

describe('leaves api', () => {
  it('uploads the file as multipart without a JSON content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({ data: { id: 7, status: 'queued' } }) })
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['x'], 'leave.xlsx')

    const result = await uploadLeaveFile('hr-token', file)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/leave_imports')
    expect(init.body).toBeInstanceOf(FormData)
    expect((init.body as FormData).get('file')).toBe(file)
    expect(new Headers(init.headers).get('Content-Type')).toBeNull()
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer hr-token')
    expect(result).toEqual({ id: 7, status: 'queued' })
  })

  it('downloads the template with the bearer token', async () => {
    const blob = new Blob(['xlsx'])
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, blob: async () => blob })
    vi.stubGlobal('fetch', fetchMock)

    await expect(downloadLeaveTemplate('hr-token')).resolves.toBe(blob)
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/leave_imports/template', {
      credentials: 'include', headers: { Authorization: 'Bearer hr-token' },
    })
  })

  it('lists leave records filtered by date with the bearer token', async () => {
    const page = { data: [], meta: { page: 1, per_page: 100, total: 0 } }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => page })
    vi.stubGlobal('fetch', fetchMock)

    await expect(listLeaveRecords('token', '2026-10-28')).resolves.toEqual(page)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/leave_records?per_page=100&leave_date=2026-10-28')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token')
  })

  it('sends the employee filter', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [], meta: {} }) })
    vi.stubGlobal('fetch', fetchMock)

    await listLeaveRecords('token', '', 3)

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/leave_records?per_page=100&employee_id=3')
  })

  it('fetches leave balances for an employee', async () => {
    const balances = [{ leave_type: 'Earned', entitled: 6, used: 1, remaining: 5 }]
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: balances }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(getLeaveBalances('token', 3)).resolves.toEqual(balances)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/employees/3/leave_balances')
  })
})
