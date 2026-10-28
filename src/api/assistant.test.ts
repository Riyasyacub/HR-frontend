import { afterEach, describe, expect, it, vi } from 'vitest'
import { askAssistant, listAssistantHistory } from './assistant'

afterEach(() => vi.unstubAllGlobals())

describe('assistant api', () => {
  it('posts the question and returns the answer', async () => {
    const answer = { columns: ['country'], rows: [['India']], row_count: 1, truncated: false, cached: false, explanation: 'Listed countries.' }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: answer }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(askAssistant('token', 'headcount by country')).resolves.toEqual(answer)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/v1/assistant/queries')
    expect(init).toMatchObject({ method: 'POST', body: JSON.stringify({ question: 'headcount by country' }) })
    expect(new Headers(init.headers).get('Authorization')).toBe('Bearer token')
  })

  it('lists the question history', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: [], meta: { page: 1, per_page: 20, total: 0 } }) })
    vi.stubGlobal('fetch', fetchMock)

    await listAssistantHistory('token')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/assistant/queries')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token')
  })
})
