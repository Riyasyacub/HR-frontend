import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiClientError } from '../api/auth'
import { downloadLeaveTemplate, getLeaveImport, uploadLeaveFile, type LeaveImport } from '../api/leaves'
import { useAuth } from '../auth/AuthContext'
import LeaveUploadPage from './LeaveUploadPage'

vi.mock('../api/leaves', () => ({ downloadLeaveTemplate: vi.fn(), getLeaveImport: vi.fn(), uploadLeaveFile: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const queued: LeaveImport = { id: 7, status: 'queued', total_rows: 0, imported_rows: 0, row_errors: [], error_message: null, created_at: '2026-10-27T22:00:00Z' }

async function uploadFile() {
  render(<LeaveUploadPage />)
  await userEvent.upload(screen.getByLabelText('Leave Excel file'), new File(['x'], 'leave.xlsx'))
  await userEvent.click(screen.getByRole('button', { name: 'Upload' }))
}

describe('LeaveUploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'hr-token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'HR Admin', email: 'hr@demo.test', role: 'HR', country: 'India' } },
      status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
    })
    URL.createObjectURL = vi.fn(() => 'blob:template')
    URL.revokeObjectURL = vi.fn()
  })

  it('downloads the template', async () => {
    vi.mocked(downloadLeaveTemplate).mockResolvedValue(new Blob(['xlsx']))
    render(<LeaveUploadPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Download template' }))

    expect(downloadLeaveTemplate).toHaveBeenCalledWith('hr-token')
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('uploads the file and shows the completed summary with row errors', async () => {
    vi.mocked(uploadLeaveFile).mockResolvedValue(queued)
    vi.mocked(getLeaveImport).mockResolvedValue({ ...queued, status: 'completed', total_rows: 2, imported_rows: 1, row_errors: [{ line: 3, errors: ['unknown employee EMP999'] }] })

    await uploadFile()

    expect(await screen.findByText('Imported 1 of 2 rows.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Line 3: unknown employee EMP999')).toBeInTheDocument()
    expect(getLeaveImport).toHaveBeenCalledTimes(1)
    expect(getLeaveImport).toHaveBeenCalledWith('hr-token', 7)
  })

  it('shows the error message when the import fails', async () => {
    vi.mocked(uploadLeaveFile).mockResolvedValue(queued)
    vi.mocked(getLeaveImport).mockResolvedValue({ ...queued, status: 'failed', error_message: 'Missing columns: leave_type' })

    await uploadFile()

    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toHaveTextContent('Missing columns: leave_type')
  })

  it('shows the API error when the upload is rejected', async () => {
    vi.mocked(uploadLeaveFile).mockRejectedValue(new ApiClientError('validation_failed', 'File must be an Excel (.xlsx) file', 422))

    await uploadFile()

    expect(await screen.findByRole('alert')).toHaveTextContent('File must be an Excel (.xlsx) file')
  })
})
