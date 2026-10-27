import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPayrollRun, recalculatePayrollRun, type PayrollRunDetail } from '../api/payroll'
import { useAuth } from '../auth/AuthContext'
import PayrollRunPage from './PayrollRunPage'

vi.mock('../api/payroll', () => ({ getPayrollRun: vi.fn(), recalculatePayrollRun: vi.fn() }))
vi.mock('../components/PayrollLinesTable', () => ({ default: () => <p>lines table</p> }))
vi.mock('../components/PayrollRunActions', () => ({ default: () => <p>run actions</p> }))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const run: PayrollRunDetail = {
  id: 4, month: '2026-11-01', status: 'draft', calculation_status: 'completed', calculation_error: null, paid_on: null, created_at: '',
  blocking_issues_count: 1,
  totals: [
    { country: 'India', currency: 'INR', employees: 2, monthly_gross: '150000.00', unpaid_deduction: '10000.00', total: '140000.00' },
    { country: 'USA', currency: 'USD', employees: 1, monthly_gross: '8000.00', unpaid_deduction: '0.00', total: '8000.00' },
  ],
}

function renderPage() {
  return render(<MemoryRouter initialEntries={['/payroll/4']}><Routes><Route path="/payroll/:id" element={<PayrollRunPage />} /></Routes></MemoryRouter>)
}

describe('PayrollRunPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'hr-token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'HR Admin', email: 'hr@demo.test', role: 'HR', country: 'India' } },
      status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
    })
  })

  it('shows the month, status and totals per country and currency', async () => {
    vi.mocked(getPayrollRun).mockResolvedValue(run)

    renderPage()

    expect(await screen.findByRole('heading', { name: 'Payroll 2026-11' })).toBeInTheDocument()
    expect(screen.getByText('draft · completed')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'India INR 2 150000.00 10000.00 140000.00' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'USA USD 1 8000.00 0.00 8000.00' })).toBeInTheDocument()
    expect(getPayrollRun).toHaveBeenCalledWith('hr-token', 4)
  })

  it('shows how many employees have blocking issues', async () => {
    vi.mocked(getPayrollRun).mockResolvedValue(run)

    renderPage()

    expect(await screen.findByText('1 employee has blocking issues and must be fixed before export.')).toBeInTheDocument()
  })

  it('recalculates and shows the refreshed totals', async () => {
    vi.mocked(getPayrollRun).mockResolvedValueOnce(run).mockResolvedValue({ ...run, blocking_issues_count: 0 })
    vi.mocked(recalculatePayrollRun).mockResolvedValue({ ...run, calculation_status: 'queued' })
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Recalculate' }))

    expect(recalculatePayrollRun).toHaveBeenCalledWith('hr-token', 4)
    expect(await screen.findByText('draft · queued')).toBeInTheDocument()
    expect(await screen.findByText('No blocking issues.', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('hides Recalculate for a run that is not a draft', async () => {
    vi.mocked(getPayrollRun).mockResolvedValue({ ...run, status: 'generated' })

    renderPage()

    await screen.findByRole('heading', { name: 'Payroll 2026-11' })
    expect(screen.queryByRole('button', { name: 'Recalculate' })).not.toBeInTheDocument()
  })

  it('shows the calculation error for a failed run', async () => {
    vi.mocked(getPayrollRun).mockResolvedValue({ ...run, calculation_status: 'failed', calculation_error: 'deadlock detected' })

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Calculation failed: deadlock detected')
  })

  it('shows the lines table only once the calculation is completed', async () => {
    vi.mocked(getPayrollRun).mockResolvedValue({ ...run, calculation_status: 'processing' })

    renderPage()

    await screen.findByRole('heading', { name: 'Payroll 2026-11' })
    expect(screen.queryByText('lines table')).not.toBeInTheDocument()
  })

  it('renders the lines table for a completed run', async () => {
    vi.mocked(getPayrollRun).mockResolvedValue(run)

    renderPage()

    expect(await screen.findByText('lines table')).toBeInTheDocument()
  })

  it('renders the generate, export and paid actions', async () => {
    vi.mocked(getPayrollRun).mockResolvedValue(run)

    renderPage()

    expect(await screen.findByText('run actions')).toBeInTheDocument()
  })
})
