import { useEffect, useState } from 'react'
import { listLeaveRecords, type LeaveRecord } from '../api/leaves'
import { useAuth } from '../auth/AuthContext'

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
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Leave records</h1>
      <input aria-label="Leave date" type="date" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} className="border rounded p-1.5 text-sm" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {records?.length === 0 && <p className="text-sm text-muted-foreground">No leave records.</p>}
      {Boolean(records?.length) && (
        <table className="w-full text-sm text-left">
          <thead><tr><th className="p-2">Employee</th><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Reason</th><th className="p-2">Payroll</th></tr></thead>
          <tbody>
            {records?.map((record) => (
              <tr key={record.id} className="border-t">
                <td className="p-2">{record.employee.name} ({record.employee.employee_id})</td>
                <td className="p-2">{record.leave_date}</td>
                <td className="p-2">{record.leave_type}</td>
                <td className="p-2">{record.reason ?? '—'}</td>
                <td className="p-2">{record.payroll_deduction ? 'Payroll deduction' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
