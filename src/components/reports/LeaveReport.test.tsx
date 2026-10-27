import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getLeaveReport, type LeaveReportPage } from '../../api/reports'
import LeaveReport from './LeaveReport'

vi.mock('../../api/reports', () => ({ getLeaveReport: vi.fn() }))
vi.mock('./DownloadReportButton', () => ({ default: ({ params }: { params: object }) => <p>download {JSON.stringify(params)}</p> }))

const report: LeaveReportPage = {
  data: [{ id: 3, employee_id: 'EMP102', name: 'Priya Sharma', balances: [{ leave_type: 'Earned', entitled: 6, used: 2, remaining: 4 }], unpaid_days: 1 }],
  meta: { page: 1, per_page: 25, total: 1, year: 2026, totals: { balances: [{ leave_type: 'Earned', entitled: 18, used: 3, remaining: 15 }], unpaid_days: 3 } },
}

describe('LeaveReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getLeaveReport).mockResolvedValue(report)
  })

  it('shows balances and unpaid days per employee with a total for all filtered employees', async () => {
    render(<LeaveReport accessToken="token" />)

    expect(await screen.findByRole('row', { name: 'EMP102 Priya Sharma 6 2 4 1' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Total 18 3 15 3' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Earned remaining' })).toBeInTheDocument()
    expect(getLeaveReport).toHaveBeenCalledWith('token', { year: String(new Date().getFullYear()), country: '' }, 1)
  })

  it('refetches page one with the applied year and country for the table and the download', async () => {
    render(<LeaveReport accessToken="token" />)

    await userEvent.clear(screen.getByLabelText('Year'))
    await userEvent.type(screen.getByLabelText('Year'), '2025')
    await userEvent.type(screen.getByLabelText('Country'), 'India')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(getLeaveReport).toHaveBeenLastCalledWith('token', { year: '2025', country: 'India' }, 1))
    expect(screen.getByText('download {"year":"2025","country":"India"}')).toBeInTheDocument()
  })
})
