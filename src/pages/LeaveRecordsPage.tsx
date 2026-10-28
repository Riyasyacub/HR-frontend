import { useEffect, useState } from 'react'
import { listLeaveRecords, type LeaveRecord } from '../api/leaves'
import { useAuth } from '../auth/AuthContext'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

export default function LeaveRecordsPage() {
  const { session } = useAuth()
  const [leaveDate, setLeaveDate] = useState('')
  const [records, setRecords] = useState<LeaveRecord[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    listLeaveRecords(session.access_token, leaveDate)
      .then((page) => { setRecords(page.data); setError('') })
      .catch(() => setError('Could not load leave records.'))
  }, [session, leaveDate])

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <PageHeader title="Leave records" description="Imported leave, filtered by date." />
      <input aria-label="Leave date" type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {records?.length === 0 && <p className="text-sm text-muted-foreground">No leave records.</p>}
      {Boolean(records?.length) && (
        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader><TableRow><TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Reason</TableHead><TableHead>Payroll</TableHead></TableRow></TableHeader>
            <TableBody>
              {records?.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employee.name} ({record.employee.employee_id})</TableCell>
                  <TableCell>{record.leave_date}</TableCell>
                  <TableCell>{record.leave_type}</TableCell>
                  <TableCell className="text-muted-foreground">{record.reason ?? '—'}</TableCell>
                  <TableCell>{record.payroll_deduction ? <StatusBadge status="Payroll deduction" tone="warning" /> : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  )
}
