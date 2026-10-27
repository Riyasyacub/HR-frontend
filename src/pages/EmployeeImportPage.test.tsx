import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadEmployeeTemplate, getEmployeeImport, uploadEmployeeFile, type EmployeeImport } from '../api/employeeImports'
import { useAuth } from '../auth/AuthContext'
import EmployeeImportPage from './EmployeeImportPage'

vi.mock('../api/employeeImports', () => ({ uploadEmployeeFile: vi.fn(), getEmployeeImport: vi.fn(), downloadEmployeeTemplate: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const queued: EmployeeImport = { id: 7, mode: 'create', status: 'queued', total_rows: 0, imported_rows: 0, row_errors: [], error_message: null, created_at: '' }

async function uploadFile() {
  await userEvent.upload(screen.getByLabelText('Employee Excel file'), new File(['x'], 'employees.xlsx'))
  await userEvent.click(screen.getByRole('button', { name: 'Upload' }))
}

describe('EmployeeImportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'hr-token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'HR Admin', email: 'hr@demo.test', role: 'HR', country: 'India' } },
      status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
    })
  })

  it('uploads, shows progress, then the summary, row errors and elapsed time', async () => {
    vi.mocked(uploadEmployeeFile).mockResolvedValue(queued)
    vi.mocked(getEmployeeImport).mockResolvedValue({
      data: { ...queued, status: 'completed', total_rows: 3, imported_rows: 2,
        row_errors: [{ line: 4, errors: ['unknown manager EMP999', 'Warning: employee was imported without a manager'] }] },
      meta: { row_errors_total: 1, errors_page: 1, errors_per_page: 50 },
    })
    render(<EmployeeImportPage />)

    await uploadFile()

    expect(uploadEmployeeFile).toHaveBeenCalledWith('hr-token', expect.any(File), 'create')
    expect(screen.getByText('Processing…')).toBeInTheDocument()
    expect(await screen.findByText('Imported 2 of 3 rows.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Line 4: unknown manager EMP999, Warning: employee was imported without a manager')).toBeInTheDocument()
    expect(screen.getByText(/^Finished in \d+ s$/)).toBeInTheDocument()
  })

  it('shows the failure message', async () => {
    vi.mocked(uploadEmployeeFile).mockResolvedValue({ ...queued, status: 'failed', error_message: 'Missing columns: hra' })
    render(<EmployeeImportPage />)

    await uploadFile()

    expect(await screen.findByRole('alert')).toHaveTextContent('Missing columns: hra')
  })

  it('downloads the template', async () => {
    vi.mocked(downloadEmployeeTemplate).mockResolvedValue(new Blob(['xlsx']))
    URL.createObjectURL = vi.fn(() => 'blob:template')
    URL.revokeObjectURL = vi.fn()
    render(<EmployeeImportPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Download template' }))

    expect(downloadEmployeeTemplate).toHaveBeenCalledWith('hr-token')
  })

  it('defaults to create without the update disclaimer', () => {
    render(<EmployeeImportPage />)

    expect(screen.getByRole('radio', { name: 'Create employees' })).toBeChecked()
    expect(screen.queryByText(/Only compensation/)).not.toBeInTheDocument()
  })

  it('shows the disclaimer and uploads in update mode', async () => {
    vi.mocked(uploadEmployeeFile).mockResolvedValue({ ...queued, mode: 'update', status: 'completed' })
    render(<EmployeeImportPage />)

    await userEvent.click(screen.getByRole('radio', { name: 'Update existing employees' }))
    expect(screen.getByText('Only compensation (Basic, HRA, Special Allowance, with optional effective_date) and manager_employee_id are applied. All other columns are ignored.')).toBeInTheDocument()
    await uploadFile()

    expect(uploadEmployeeFile).toHaveBeenCalledWith('hr-token', expect.any(File), 'update')
  })

  it('shows the error count and pages through row errors', async () => {
    vi.mocked(uploadEmployeeFile).mockResolvedValue(queued)
    vi.mocked(getEmployeeImport).mockImplementation(async (_token, _id, page = 1) => ({
      data: { ...queued, status: 'completed', total_rows: 120, imported_rows: 0, row_errors: [{ line: page + 1, errors: ['employee_id already exists'] }] },
      meta: { row_errors_total: 120, errors_page: page, errors_per_page: 50 },
    }))
    render(<EmployeeImportPage />)

    await uploadFile()

    expect(await screen.findByText('120 rows with errors', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('Line 3: employee_id already exists')).toBeInTheDocument()
    expect(getEmployeeImport).toHaveBeenLastCalledWith('hr-token', 7, 2)
  })
})
