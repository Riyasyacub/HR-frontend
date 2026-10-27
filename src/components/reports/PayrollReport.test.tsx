import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getPayrollReport } from '../../api/reports'
import PayrollReport from './PayrollReport'

vi.mock('../../api/reports', () => ({ getPayrollReport: vi.fn() }))
vi.mock('./DownloadReportButton', () => ({ default: ({ params }: { params: object }) => <p>download {JSON.stringify(params)}</p> }))

const rows = [
  { month: '2026-11', country: 'India', currency: 'INR', employees: 2, monthly_gross: '150000.00', unpaid_deduction: '10000.00', total: '140000.00' },
  { month: '2026-11', country: 'USA', currency: 'USD', employees: 1, monthly_gross: '8000.00', unpaid_deduction: '0.00', total: '8000.00' },
]

describe('PayrollReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows totals by month, country and currency without combining currencies', async () => {
    vi.mocked(getPayrollReport).mockResolvedValue({ data: rows, meta: { year: 2026 } })

    render(<PayrollReport accessToken="token" />)

    expect(await screen.findByRole('row', { name: '2026-11 India INR 2 150000.00 10000.00 140000.00' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: '2026-11 USA USD 1 8000.00 0.00 8000.00' })).toBeInTheDocument()
    expect(getPayrollReport).toHaveBeenCalledWith('token', { year: String(new Date().getFullYear()), country: '' })
  })

  it('refetches with the applied year and country for the table and the download', async () => {
    vi.mocked(getPayrollReport).mockResolvedValue({ data: rows, meta: { year: 2026 } })
    render(<PayrollReport accessToken="token" />)

    await userEvent.clear(screen.getByLabelText('Year'))
    await userEvent.type(screen.getByLabelText('Year'), '2026')
    await userEvent.type(screen.getByLabelText('Country'), 'USA')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(getPayrollReport).toHaveBeenLastCalledWith('token', { year: '2026', country: 'USA' }))
    expect(screen.getByText('download {"year":"2026","country":"USA"}')).toBeInTheDocument()
  })

  it('says when no runs have been generated for the year', async () => {
    vi.mocked(getPayrollReport).mockResolvedValue({ data: [], meta: { year: 2026 } })

    render(<PayrollReport accessToken="token" />)

    expect(await screen.findByText('No generated payroll runs for this year.')).toBeInTheDocument()
  })
})
