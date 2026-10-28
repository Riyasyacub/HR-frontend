import { useEffect, useState, type FormEvent } from 'react'
import { downloadLeaveTemplate, getLeaveImport, uploadLeaveFile, type LeaveImport } from '../api/leaves'
import { useAuth } from '../auth/AuthContext'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui/button'

const POLL_INTERVAL_MS = 2000

export default function LeaveUploadPage() {
  const { session } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [leaveImport, setLeaveImport] = useState<LeaveImport | null>(null)
  const [error, setError] = useState('')
  const pending = leaveImport?.status === 'queued' || leaveImport?.status === 'processing'

  useEffect(() => {
    if (!session || !leaveImport || !pending) return
    const poll = () => getLeaveImport(session.access_token, leaveImport.id).then(setLeaveImport).catch(() => setError('Could not load the import status.'))
    const timer = setTimeout(poll, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [session, leaveImport, pending])

  async function downloadTemplate() {
    if (!session) return
    const url = URL.createObjectURL(await downloadLeaveTemplate(session.access_token))
    Object.assign(document.createElement('a'), { href: url, download: 'leave_template.xlsx' }).click()
    URL.revokeObjectURL(url)
  }

  async function upload(event: FormEvent) {
    event.preventDefault()
    if (!session || !file) return
    setError('')
    setLeaveImport(null)
    try {
      setLeaveImport(await uploadLeaveFile(session.access_token, file))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.')
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <PageHeader title="Leave upload" description="Upload the overnight leave Excel; balances update as rows import." />
      <div className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
      <Button variant="outline" onClick={() => void downloadTemplate().catch(() => setError('Could not download the template.'))}>Download template</Button>
      <form onSubmit={upload} className="flex gap-2 items-center">
        <input aria-label="Leave Excel file" type="file" accept=".xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        <Button type="submit" disabled={!file || pending}>Upload</Button>
      </form>
      </div>
      {pending && <p className="text-sm text-muted-foreground">Processing…</p>}
      {leaveImport?.status === 'completed' && (
        <div className="space-y-1 rounded-xl border bg-card p-5 text-sm shadow-sm">
          <p>Imported {leaveImport.imported_rows} of {leaveImport.total_rows} rows.</p>
          {leaveImport.row_errors.map((rowError) => <p key={rowError.line} className="text-red-600">Line {rowError.line}: {rowError.errors.join(', ')}</p>)}
        </div>
      )}
      {(error || leaveImport?.status === 'failed') && <p role="alert" className="text-sm text-red-600">{error || leaveImport?.error_message}</p>}
    </main>
  )
}
