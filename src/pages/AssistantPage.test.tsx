import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { askAssistant, listAssistantHistory } from '../api/assistant'
import { ApiClientError } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import AssistantPage from './AssistantPage'

vi.mock('../api/assistant', () => ({ askAssistant: vi.fn(), listAssistantHistory: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const answer = { columns: ['country', 'headcount'], rows: [['India', 6005], ['USA', 2502]], row_count: 2, truncated: false, cached: false, explanation: null }

async function ask(question: string) {
  await userEvent.clear(screen.getByLabelText('Question'))
  await userEvent.type(screen.getByLabelText('Question'), question)
  await userEvent.click(screen.getByRole('button', { name: 'Ask' }))
}

describe('AssistantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'HR Admin', email: 'hr@demo.test', role: 'HR', country: 'India' } },
      status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
    })
    vi.mocked(listAssistantHistory).mockResolvedValue({ data: [], meta: { page: 1, per_page: 20, total: 0 } })
  })

  it('shows each answer as a table, newest first', async () => {
    vi.mocked(askAssistant).mockResolvedValueOnce(answer).mockResolvedValueOnce({ ...answer, columns: ['total'], rows: [[10009]], row_count: 1 })
    render(<AssistantPage />)

    await ask('headcount by country')
    expect(await screen.findByRole('row', { name: 'India 6005' })).toBeInTheDocument()
    await ask('total employees')

    const cards = await screen.findAllByRole('article')
    expect(within(cards[0]).getByText('total employees')).toBeInTheDocument()
    expect(within(cards[0]).getByRole('row', { name: '10009' })).toBeInTheDocument()
    expect(within(cards[1]).getByText('headcount by country')).toBeInTheDocument()
    expect(askAssistant).toHaveBeenCalledWith('token', 'headcount by country')
  })

  it('marks cached and truncated answers', async () => {
    vi.mocked(askAssistant).mockResolvedValue({ ...answer, cached: true, truncated: true })
    render(<AssistantPage />)

    await ask('headcount by country')

    expect(await screen.findByText('Cached')).toBeInTheDocument()
    expect(screen.getByText('Showing the first 200 rows.')).toBeInTheDocument()
  })

  it('shows the API error in the question card', async () => {
    vi.mocked(askAssistant).mockRejectedValue(new ApiClientError('rate_limited', 'Too many questions; try again in a minute', 429))
    render(<AssistantPage />)

    await ask('headcount by country')

    const card = await screen.findByRole('article')
    expect(within(card).getByRole('alert')).toHaveTextContent('Too many questions; try again in a minute')
  })

  it('does not send an empty question and limits its length', async () => {
    render(<AssistantPage />)

    expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
    expect(screen.getByLabelText('Question')).toHaveAttribute('maxLength', '500')
  })

  it('fills the question from an example', async () => {
    render(<AssistantPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Headcount by country' }))

    expect(screen.getByLabelText('Question')).toHaveValue('Headcount by country')
  })

  it('does not show the model explanation', async () => {
    vi.mocked(askAssistant).mockResolvedValue({ ...answer, explanation: 'Counted active employees grouped by country.' })
    render(<AssistantPage />)

    await ask('headcount by country')

    expect(await screen.findByRole('row', { name: 'India 6005' })).toBeInTheDocument()
    expect(screen.queryByText(/How this was answered/)).not.toBeInTheDocument()
  })

  describe('history', () => {
    const past = [
      { id: 2, question: 'payroll totals', status: 'rejected' as const, message: 'Which year do you mean?', created_at: '2026-10-28T10:00:00Z' },
      { id: 1, question: 'headcount by country', status: 'answered' as const, message: null, created_at: '2026-10-28T09:00:00Z' },
    ]

    beforeEach(() => vi.mocked(listAssistantHistory).mockResolvedValue({ data: past, meta: { page: 1, per_page: 20, total: 2 } }))

    it('shows past questions newest first with failure messages', async () => {
      render(<AssistantPage />)

      const cards = await screen.findAllByRole('article')
      expect(within(cards[0]).getByText('payroll totals')).toBeInTheDocument()
      expect(within(cards[0]).getByRole('alert')).toHaveTextContent('Which year do you mean?')
      expect(within(cards[1]).getByText('headcount by country')).toBeInTheDocument()
      expect(listAssistantHistory).toHaveBeenCalledWith('token')
    })

    it('re-asks a past question to show its answer', async () => {
      vi.mocked(askAssistant).mockResolvedValue({ ...answer, cached: true })
      render(<AssistantPage />)

      await userEvent.click(await screen.findByRole('button', { name: 'Show answer' }))

      expect(await screen.findByRole('row', { name: 'India 6005' })).toBeInTheDocument()
      expect(askAssistant).toHaveBeenCalledWith('token', 'headcount by country')
    })

    it('puts a new question above the history', async () => {
      vi.mocked(askAssistant).mockResolvedValue(answer)
      render(<AssistantPage />)
      await screen.findAllByRole('article')

      await ask('total employees')

      expect(within((await screen.findAllByRole('article'))[0]).getByText('total employees')).toBeInTheDocument()
    })
  })
})
