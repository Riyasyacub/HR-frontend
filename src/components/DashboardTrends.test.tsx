import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTrends, type Trends } from '../api/reports'
import DashboardTrends from './DashboardTrends'

vi.mock('../api/reports', () => ({ getTrends: vi.fn() }))

const trends: Trends = {
  months: ['2026-10', '2026-11'], headcount: [10007, 10009], joiners: [3, 2],
  leave_days: [{ leave_type: 'Earned', values: [40, 12] }, { leave_type: 'Unpaid', values: [5, 1] }],
  payroll_totals: [{ currency: 'INR', values: ['0.00', '9000000.00'] }, { currency: 'USD', values: ['0.00', '800000.00'] }],
}

function renderTrends(isHr = true) {
  render(<MemoryRouter><DashboardTrends accessToken="token" isHr={isHr} /></MemoryRouter>)
}

describe('DashboardTrends', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows headcount, joiners, leave and payroll trend cards for HR', async () => {
    vi.mocked(getTrends).mockResolvedValue(trends)

    renderTrends()

    expect(await screen.findByText('Headcount trend')).toBeInTheDocument()
    expect(screen.getByText('Latest: 10,009')).toBeInTheDocument()
    expect(screen.getByText('Joiners per month')).toBeInTheDocument()
    expect(screen.getByText('Leave days by type')).toBeInTheDocument()
    expect(screen.getByText('Payroll total (INR)')).toBeInTheDocument()
    expect(screen.getByText('Payroll total (USD)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View in Reports' })).toHaveAttribute('href', '/reports')
    expect(getTrends).toHaveBeenCalledWith('token')
  })

  it('shows a manager no payroll trends', async () => {
    vi.mocked(getTrends).mockResolvedValue({ ...trends, payroll_totals: null })

    renderTrends(false)

    expect(await screen.findByText('Headcount trend')).toBeInTheDocument()
    expect(screen.queryByText(/Payroll total/)).not.toBeInTheDocument()
  })

  it('names each leave type in the legend', async () => {
    vi.mocked(getTrends).mockResolvedValue(trends)

    renderTrends()

    const legend = await screen.findByRole('list', { name: 'Leave types' })
    expect(legend).toHaveTextContent('Earned')
    expect(legend).toHaveTextContent('Unpaid')
  })

  it('shows an error when trends cannot be loaded', async () => {
    vi.mocked(getTrends).mockRejectedValue(new Error('boom'))

    renderTrends()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the trends.')
  })
})
