import { useEffect, useRef, useState, type FormEvent } from 'react'
import { downloadEmployeeTemplate, getEmployeeImport, uploadEmployeeFile, type EmployeeImport, type EmployeeImportMode, type ErrorsMeta } from '../api/employeeImports'
import { useAuth } from '../auth/AuthContext'
import Pager from '../components/Pager'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui/button'

const POLL_INTERVAL_MS = 2000
const isPending = (employeeImport: EmployeeImport) => employeeImport.status === 'queued' || employeeImport.status === 'processing'

export default function EmployeeImportPage() {
  const { session } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<EmployeeImportMode>('create')
  const [employeeImport, setEmployeeImport] = useState<EmployeeImport | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number | null>(null)
  const [errorsMeta, setErrorsMeta] = useState<ErrorsMeta | null>(null)
  const [error, setError] = useState('')
  const startedAt = useRef(0)
  const pending = employeeImport !== null && isPending(employeeImport)

  function track(latest: EmployeeImport, meta: ErrorsMeta | null = null) {
    if (!isPending(latest)) setElapsedSeconds((current) => current ?? Math.round((Date.now() - startedAt.current) / 1000))
    setEmployeeImport(latest)
    setErrorsMeta(meta)
  }

  function showErrorsPage(page: number) {
    if (session && employeeImport) getEmployeeImport(session.access_token, employeeImport.id, page).then((result) => track(result.data, result.meta)).catch(() => setError('Could not load the import status.'))
  }

  useEffect(() => {
    if (!session || !employeeImport || !pending) return
    const poll = () => getEmployeeImport(session.access_token, employeeImport.id).then((result) => track(result.data, result.meta)).catch(() => setError('Could not load the import status.'))
    const timer = setTimeout(poll, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [session, employeeImport, pending])

  async function downloadTemplate() {
    if (!session) return
    const url = URL.createObjectURL(await downloadEmployeeTemplate(session.access_token))
    Object.assign(document.createElement('a'), { href: url, download: 'employee_template.xlsx' }).click()
    URL.revokeObjectURL(url)
  }

  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!session || !file) return
    setError('')
    setEmployeeImport(null)
    setElapsedSeconds(null)
    startedAt.current = Date.now()
    try {
      track(await uploadEmployeeFile(session.access_token, file, mode))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <PageHeader title="Employee import" description="Create employees in bulk, or update compensation and managers, from one Excel sheet." />
      <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <Button variant="outline" onClick={() => void downloadTemplate().catch(() => setError('Could not download the template.'))}>Download template</Button>
      <fieldset className="flex gap-4 text-sm">
        {([['create', 'Create employees'], ['update', 'Update existing employees']] as const).map(([value, label]) => (
          <label key={value} className="flex items-center gap-1"><input type="radio" name="mode" checked={mode === value} onChange={() => setMode(value)} />{label}</label>
        ))}
      </fieldset>
      {mode === 'update' && <p className="text-sm border rounded p-2 bg-muted">Only compensation (Basic, HRA, Special Allowance, with optional effective_date) and manager_employee_id are applied. All other columns are ignored.</p>}
      <form onSubmit={upload} className="flex gap-2 items-center">
        <input aria-label="Employee Excel file" type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <Button type="submit" disabled={!file || pending}>Upload</Button>
      </form>
      </div>
      {pending && <p className="text-sm text-muted-foreground">Processing…</p>}
      {elapsedSeconds !== null && <p className="text-sm">Finished in {elapsedSeconds} s</p>}
      {employeeImport?.status === 'completed' && (
        <div className="space-y-1 rounded-xl border bg-card p-5 text-sm shadow-sm">
          <p>Imported {employeeImport.imported_rows} of {employeeImport.total_rows} rows.</p>
          {errorsMeta && errorsMeta.row_errors_total > 0 && <p>{errorsMeta.row_errors_total} rows with errors</p>}
          {employeeImport.row_errors.map((rowError) => <p key={rowError.line} className="text-red-600">Line {rowError.line}: {rowError.errors.join(', ')}</p>)}
          {errorsMeta && errorsMeta.row_errors_total > errorsMeta.errors_per_page && (
            <Pager page={errorsMeta.errors_page} pageCount={Math.ceil(errorsMeta.row_errors_total / errorsMeta.errors_per_page)} onPage={showErrorsPage} />
          )}
        </div>
      )}
      {(error || employeeImport?.status === 'failed') && <p role="alert" className="text-sm text-red-600">{error || employeeImport?.error_message}</p>}
    </main>
  )
}
