import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '../../api/auth'
import { getJoiners, type Joiner } from '../../api/reports'
import JoinersReport from './JoinersReport'

vi.mock('../../api/reports', () => ({ getJoiners: vi.fn() }))
vi.mock('./DownloadReportButton', () => ({ default: ({ params }: { params: object }) => <p>download {JSON.stringify(params)}</p> }))

const nisha: Joiner = { id: 12, employee_id: 'EMP300', name: 'Nisha Rao', country: 'India', department: 'Engineering', start_date: '2026-11-20' }
const novemberParams = { from: '2026-11-01', to: '2026-11-30', country: '' }

function renderReport() {
  render(<MemoryRouter><JoinersReport accessToken="token" /></MemoryRouter>)
}

describe('JoinersReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 15))
  })
  afterEach(() => vi.useRealTimers())

  it('lists joiners for the current month linked to their records', async () => {
    vi.mocked(getJoiners).mockResolvedValue({ data: [nisha], meta: { page: 1, per_page: 25, total: 1 } })

    renderReport()

    expect(await screen.findByRole('row', { name: 'EMP300 Nisha Rao India Engineering 2026-11-20' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nisha Rao' })).toHaveAttribute('href', '/employees/12')
    expect(getJoiners).toHaveBeenCalledWith('token', novemberParams, 1)
  })

  it('refetches page one with the applied period and country for the table and the download', async () => {
    vi.mocked(getJoiners).mockResolvedValue({ data: [nisha], meta: { page: 1, per_page: 25, total: 1 } })
    renderReport()

    await userEvent.clear(screen.getByLabelText('From'))
    await userEvent.type(screen.getByLabelText('From'), '2026-10-01')
    await userEvent.type(screen.getByLabelText('Country'), 'India')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    const applied = { from: '2026-10-01', to: '2026-11-30', country: 'India' }
    await waitFor(() => expect(getJoiners).toHaveBeenLastCalledWith('token', applied, 1))
    expect(screen.getByText(`download ${JSON.stringify(applied)}`)).toBeInTheDocument()
  })

  it('pages with Next and Previous, disabled at the ends', async () => {
    vi.mocked(getJoiners).mockImplementation(async (_token, _params, page) => ({ data: [nisha], meta: { page, per_page: 25, total: 30 } }))
    renderReport()

    expect(await screen.findByRole('button', { name: 'Previous' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    await waitFor(() => expect(getJoiners).toHaveBeenLastCalledWith('token', novemberParams, 2))
    expect(await screen.findByText('Page 2 of 2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('shows the API message for an invalid period', async () => {
    vi.mocked(getJoiners).mockRejectedValue(new ApiClientError('invalid_period', 'from and to must be dates with from on or before to', 422))

    renderReport()

    expect(await screen.findByRole('alert')).toHaveTextContent('from and to must be dates with from on or before to')
  })
})
