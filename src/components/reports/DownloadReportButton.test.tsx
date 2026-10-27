import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadReport } from '../../api/reports'
import DownloadReportButton from './DownloadReportButton'

vi.mock('../../api/reports', () => ({ downloadReport: vi.fn() }))

describe('DownloadReportButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:report')
    URL.revokeObjectURL = vi.fn()
  })

  it('downloads the report with the applied filters', async () => {
    vi.mocked(downloadReport).mockResolvedValue(new Blob(['xlsx']))
    render(<DownloadReportButton accessToken="token" report="headcount" params={{ group_by: 'country', country: 'India' }} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download XLSX' }))

    expect(downloadReport).toHaveBeenCalledWith('token', 'headcount', { group_by: 'country', country: 'India' })
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('shows an error when the download fails', async () => {
    vi.mocked(downloadReport).mockRejectedValue(new Error('boom'))
    render(<DownloadReportButton accessToken="token" report="headcount" params={{}} />)

    await userEvent.click(screen.getByRole('button', { name: 'Download XLSX' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not download the report.')
  })
})
