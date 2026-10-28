import { request } from './auth'

export type AssistantAnswer = {
  columns: string[]; rows: unknown[][]; row_count: number; truncated: boolean; cached: boolean; explanation: string | null
}

export async function askAssistant(accessToken: string, question: string): Promise<AssistantAnswer> {
  const { data } = await request<{ data: AssistantAnswer }>('/assistant/queries', {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ question }),
  })
  return data
}

export type AssistantHistoryItem = { id: number; question: string; status: 'answered' | 'cached' | 'rejected' | 'failed'; message: string | null; created_at: string }

export function listAssistantHistory(accessToken: string): Promise<{ data: AssistantHistoryItem[]; meta: { page: number; per_page: number; total: number } }> {
  return request('/assistant/queries', { headers: { Authorization: `Bearer ${accessToken}` } })
}
