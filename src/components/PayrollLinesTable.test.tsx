import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listPayrollLines, type PayrollLine } from '../api/payroll'
import PayrollLinesTable from './PayrollLinesTable'

vi.mock('../api/payroll', () => ({ listPayrollLines: vi.fn() }))

const line: PayrollLine = {
  id: 31, employee: { id: 3, employee_id: 'EMP102', name: 'Priya Sharma' }, country: 'India', currency: 'INR',
  monthly_gross: '100000.00', working_days: 20, unpaid_days: 2, unpaid_deduction: '10000.00', total: '90000.00',
  blocking_issues: ['missing account number'],
}

describe('PayrollLinesTable', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists each line with amounts and issues', async () => {
    vi.mocked(listPayrollLines).mockResolvedValue({ data: [line], meta: { page: 1, per_page: 25, total: 1 } })

    render(<PayrollLinesTable accessToken="token" runId={4} />)

    expect(await screen.findByRole('row', { name: 'Priya Sharma (EMP102) INR 100000.00 20 2 10000.00 90000.00 missing account number' })).toBeInTheDocument()
    expect(listPayrollLines).toHaveBeenCalledWith('token', 4, 1, false)
  })

  it('refetches only lines with issues when "Issues only" is ticked', async () => {
    vi.mocked(listPayrollLines).mockResolvedValue({ data: [line], meta: { page: 1, per_page: 25, total: 1 } })
    render(<PayrollLinesTable accessToken="token" runId={4} />)

    await userEvent.click(screen.getByRole('checkbox', { name: 'Issues only' }))

    await waitFor(() => expect(listPayrollLines).toHaveBeenLastCalledWith('token', 4, 1, true))
  })

  it('pages with Next and Previous, disabled at the ends', async () => {
    vi.mocked(listPayrollLines).mockImplementation(async (_token, _id, page) => ({ data: [line], meta: { page, per_page: 25, total: 30 } }))
    render(<PayrollLinesTable accessToken="token" runId={4} />)

    expect(await screen.findByRole('button', { name: 'Previous' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(listPayrollLines).toHaveBeenLastCalledWith('token', 4, 2, false))
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
