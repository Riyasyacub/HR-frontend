import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '../api/auth'
import { createPayrollRun, listPayrollRuns, type PayrollRun } from '../api/payroll'
import { useAuth } from '../auth/AuthContext'
import PayrollRunsPage from './PayrollRunsPage'

vi.mock('../api/payroll', () => ({ createPayrollRun: vi.fn(), listPayrollRuns: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const october: PayrollRun = { id: 3, month: '2026-10-01', status: 'draft', calculation_status: 'completed', calculation_error: null, paid_on: null, created_at: '' }
const page = (data: PayrollRun[]) => ({ data, meta: { page: 1, per_page: 25, total: data.length } })

function renderPage() {
  return render(<MemoryRouter><PayrollRunsPage /></MemoryRouter>)
}

describe('PayrollRunsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'hr-token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'HR Admin', email: 'hr@demo.test', role: 'HR', country: 'India' } },
      status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
    })
  })

  it('lists runs with status and a link to each run', async () => {
    vi.mocked(listPayrollRuns).mockResolvedValue(page([october]))

    renderPage()

    const link = await screen.findByRole('link', { name: '2026-10' })
    expect(link).toHaveAttribute('href', '/payroll/3')
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(screen.getByText('completed')).toBeInTheDocument()
  })

  it('creates a run for the chosen month', async () => {
    vi.mocked(listPayrollRuns).mockResolvedValue(page([october]))
    vi.mocked(createPayrollRun).mockResolvedValue({ ...october, id: 4, month: '2026-11-01', calculation_status: 'completed' })
    renderPage()

    await userEvent.type(screen.getByLabelText('Payroll month'), '2026-11')
    await userEvent.click(screen.getByRole('button', { name: 'Create run' }))

    expect(createPayrollRun).toHaveBeenCalledWith('hr-token', '2026-11')
    expect(await screen.findByRole('link', { name: '2026-11' })).toBeInTheDocument()
  })

  it('shows the API error when the month already has a run', async () => {
    vi.mocked(listPayrollRuns).mockResolvedValue(page([]))
    vi.mocked(createPayrollRun).mockRejectedValue(new ApiClientError('validation_failed', 'Month has already been taken', 422))
    renderPage()

    await userEvent.type(screen.getByLabelText('Payroll month'), '2026-11')
    await userEvent.click(screen.getByRole('button', { name: 'Create run' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Month has already been taken')
  })

  it('keeps checking while a run is calculating', async () => {
    vi.mocked(listPayrollRuns)
      .mockResolvedValueOnce(page([{ ...october, calculation_status: 'queued' }]))
      .mockResolvedValue(page([october]))

    renderPage()

    expect(await screen.findByText('queued')).toBeInTheDocument()
    expect(await screen.findByText('completed', {}, { timeout: 3000 })).toBeInTheDocument()
  })
})
