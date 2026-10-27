import { useEffect, useState } from 'react'
import { listLeaveRecords, type LeaveRecord } from '../api/leaves'

export default function LeaveHistory({ accessToken, employeeId }: { accessToken: string; employeeId: number }) {
  const [records, setRecords] = useState<LeaveRecord[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listLeaveRecords(accessToken, '', employeeId).then((page) => setRecords(page.data)).catch(() => setError('Could not load leave history.'))
  }, [accessToken, employeeId])

  return (
    <div className="border p-4 rounded text-sm space-y-2">
      <h2 className="font-semibold">Leave history</h2>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {records?.length === 0 && <p className="text-xs text-muted-foreground">No leave taken.</p>}
      <ul className="space-y-1">
        {records?.map((record) => (
          <li key={record.id}>{[record.leave_date, record.leave_type, record.reason, record.payroll_deduction && 'Payroll deduction'].filter(Boolean).join(' · ')}</li>
        ))}
      </ul>
    </div>
  )
}
