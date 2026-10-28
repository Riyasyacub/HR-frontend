import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listPayrollRuns } from '../api/payroll'
import { getHeadcount, getJoiners } from '../api/reports'
import DashboardTiles from './DashboardTiles'

vi.mock('../api/reports', () => ({ getHeadcount: vi.fn(), getJoiners: vi.fn() }))
vi.mock('../api/payroll', () => ({ listPayrollRuns: vi.fn() }))

const run = { id: 4, month: '2026-11-01', status: 'generated' as const, calculation_status: 'completed' as const, calculation_error: null, paid_on: null, created_at: '' }

function renderTiles(isHr: boolean) {
  render(<MemoryRouter><DashboardTiles accessToken="token" isHr={isHr} /></MemoryRouter>)
}

describe('DashboardTiles', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 15))
    vi.mocked(getHeadcount).mockResolvedValue({ data: [], meta: { group_by: 'country', headcount: 42, onboarding: 3 } })
    vi.mocked(getJoiners).mockResolvedValue({ data: [], meta: { page: 1, per_page: 1, total: 5 } })
    vi.mocked(listPayrollRuns).mockResolvedValue({ data: [run], meta: { page: 1, per_page: 25, total: 1 } })
  })

  it('shows HR headcount, joiners this month and the latest payroll run linked to their lists, without onboarding', async () => {
    renderTiles(true)

    expect(await screen.findByRole('link', { name: 'Headcount 42' })).toHaveAttribute('href', '/reports')
    expect(screen.queryByText('Onboarding')).not.toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Joiners this month 5' })).toHaveAttribute('href', '/reports')
    expect(await screen.findByRole('link', { name: 'Latest payroll 2026-11 generated' })).toHaveAttribute('href', '/payroll/4')
    expect(getJoiners).toHaveBeenCalledWith('token', { from: '2026-11-01', to: '2026-11-30' }, 1)
  })

  it('shows a manager team numbers without payroll', async () => {
    renderTiles(false)

    expect(await screen.findByRole('link', { name: 'Team headcount 42' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Joiners this month 5' })).toBeInTheDocument()
    expect(screen.queryByText(/Latest payroll/)).not.toBeInTheDocument()
    expect(listPayrollRuns).not.toHaveBeenCalled()
  })

  it('says when there are no payroll runs yet', async () => {
    vi.mocked(listPayrollRuns).mockResolvedValue({ data: [], meta: { page: 1, per_page: 25, total: 0 } })

    renderTiles(true)

    expect(await screen.findByRole('link', { name: 'Latest payroll No payroll runs yet' })).toHaveAttribute('href', '/payroll')
  })
})
