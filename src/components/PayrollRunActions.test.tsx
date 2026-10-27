import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadPayrollExport, generatePayrollRun, markPayrollRunPaid, type PayrollRun } from '../api/payroll'
import { ApiClientError } from '../api/auth'
import PayrollRunActions from './PayrollRunActions'

vi.mock('../api/payroll', () => ({ generatePayrollRun: vi.fn(), markPayrollRunPaid: vi.fn(), downloadPayrollExport: vi.fn() }))

const run: PayrollRun = {
  id: 4, month: '2026-11-01', status: 'draft', calculation_status: 'completed', calculation_error: null, paid_on: null, created_at: '',
}

function renderActions(overrides: Partial<PayrollRun> = {}, blockingIssues = 0) {
  const onChange = vi.fn()
  render(<PayrollRunActions accessToken="token" run={{ ...run, ...overrides }} blockingIssues={blockingIssues} onChange={onChange} />)
  return onChange
}

describe('PayrollRunActions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('disables Generate while the run has blocking issues', () => {
    renderActions({}, 2)

    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled()
  })

  it('generates a ready draft and reports the updated run', async () => {
    vi.mocked(generatePayrollRun).mockResolvedValue({ ...run, status: 'generated' })
    const onChange = renderActions()

    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    expect(generatePayrollRun).toHaveBeenCalledWith('token', 4)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'generated' }))
  })

  it('downloads the XLSX for a generated run', async () => {
    vi.mocked(downloadPayrollExport).mockResolvedValue(new Blob(['xlsx']))
    URL.createObjectURL = vi.fn(() => 'blob:payroll')
    URL.revokeObjectURL = vi.fn()
    renderActions({ status: 'generated' })

    await userEvent.click(screen.getByRole('button', { name: 'Download XLSX' }))

    expect(downloadPayrollExport).toHaveBeenCalledWith('token', 4)
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('marks a generated run paid with the chosen date', async () => {
    vi.mocked(markPayrollRunPaid).mockResolvedValue({ ...run, status: 'paid', paid_on: '2026-12-01' })
    const onChange = renderActions({ status: 'generated' })

    await userEvent.type(screen.getByLabelText('Paid on'), '2026-12-01')
    await userEvent.click(screen.getByRole('button', { name: 'Mark paid' }))

    expect(markPayrollRunPaid).toHaveBeenCalledWith('token', 4, '2026-12-01')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'paid', paid_on: '2026-12-01' }))
  })

  it('shows the paid date for a paid run without Mark paid', () => {
    renderActions({ status: 'paid', paid_on: '2026-12-01' })

    expect(screen.getByText('Paid on 2026-12-01')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark paid' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download XLSX' })).toBeInTheDocument()
  })

  it('shows the API error when an action fails', async () => {
    vi.mocked(generatePayrollRun).mockRejectedValue(new ApiClientError('not_generatable', 'Fix blocking issues first', 422))
    renderActions()

    await userEvent.click(screen.getByRole('button', { name: 'Generate' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Fix blocking issues first')
  })
})
