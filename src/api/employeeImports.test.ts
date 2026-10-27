import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadEmployeeTemplate, getEmployeeImport, uploadEmployeeFile } from './employeeImports'

afterEach(() => vi.unstubAllGlobals())

describe('employee imports api', () => {
  it('uploads the file with the mode and reads its status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 202, json: async () => ({ data: { id: 7 } }) })
    vi.stubGlobal('fetch', fetchMock)
    const file = new File(['x'], 'employees.xlsx')

    await expect(uploadEmployeeFile('token', file, 'create')).resolves.toEqual({ id: 7 })
    await getEmployeeImport('token', 7, 2)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/employee_imports')
    expect((init.body as FormData).get('file')).toBe(file)
    expect((init.body as FormData).get('mode')).toBe('create')
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token')
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/employee_imports/7?errors_page=2')
  })

  it('downloads the template', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(['xlsx']) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(downloadEmployeeTemplate('token')).resolves.toBeInstanceOf(Blob)
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/employee_imports/template')
  })
})
