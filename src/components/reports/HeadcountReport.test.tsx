import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHeadcount } from '../../api/reports'
import HeadcountReport from './HeadcountReport'

vi.mock('../../api/reports', () => ({ getHeadcount: vi.fn() }))
vi.mock('./DownloadReportButton', () => ({ default: ({ params }: { params: object }) => <p>download {JSON.stringify(params)}</p> }))

const report = {
  data: [{ group: 'India', headcount: 2, onboarding: 1 }, { group: 'USA', headcount: 1, onboarding: 0 }],
  meta: { group_by: 'country', headcount: 3, onboarding: 1 },
}

describe('HeadcountReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads headcount by country with a total row', async () => {
    vi.mocked(getHeadcount).mockResolvedValue(report)

    render(<HeadcountReport accessToken="token" />)

    expect(await screen.findByRole('row', { name: 'India 2' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'USA 1' })).toBeInTheDocument()
    expect(screen.getByRole('row', { name: 'Total 3' })).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Onboarding' })).not.toBeInTheDocument()
    expect(getHeadcount).toHaveBeenCalledWith('token', { group_by: 'country', country: '' })
    expect(screen.getByText('download {"group_by":"country","country":""}')).toBeInTheDocument()
  })

  it('refetches with the applied grouping and country', async () => {
    vi.mocked(getHeadcount).mockResolvedValue(report)
    render(<HeadcountReport accessToken="token" />)

    await userEvent.selectOptions(screen.getByLabelText('Group by'), 'department')
    await userEvent.type(screen.getByLabelText('Country'), 'India')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => expect(getHeadcount).toHaveBeenLastCalledWith('token', { group_by: 'department', country: 'India' }))
  })

  it('shows an error when the report cannot be loaded', async () => {
    vi.mocked(getHeadcount).mockRejectedValue(new Error('boom'))

    render(<HeadcountReport accessToken="token" />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the headcount report.')
  })
})
