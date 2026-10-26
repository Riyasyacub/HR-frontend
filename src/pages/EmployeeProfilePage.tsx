import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getEmployee, type EmployeeDetail } from '../api/employees'
import { useAuth } from '../auth/AuthContext'

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session && id) getEmployee(session.access_token, Number(id)).then(setEmployee).catch((e) => setError(e instanceof Error ? e.message : 'Could not load profile.'))
  }, [session, id])

  if (error) return <main className="p-6"><p role="alert" className="text-sm text-red-600">{error}</p></main>
  if (!employee) return <main className="p-6">Loading…</main>
  const c = employee.compensation

  return (
    <main className="p-6 max-w-xl space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{employee.first_name} {employee.last_name}</h1>
        <span className="text-xs border px-2 py-0.5 rounded">{employee.status}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm border p-4 rounded">
        <div><span className="text-muted-foreground">ID:</span> {employee.employee_id}</div>
        <div><span className="text-muted-foreground">Title:</span> {employee.job_title}</div>
        <div><span className="text-muted-foreground">Email:</span> {employee.work_email}</div>
        <div><span className="text-muted-foreground">Department:</span> {employee.department.name}</div>
        <div><span className="text-muted-foreground">Country:</span> {employee.country}</div>
        <div><span className="text-muted-foreground">Start date:</span> {employee.start_date}</div>
      </div>
      <div className="border p-4 rounded text-sm space-y-1">
        <h2 className="font-semibold">Bank details (read-only)</h2>
        <div><span className="text-muted-foreground">Bank:</span> {employee.bank.bank_name}</div>
        <div><span className="text-muted-foreground">Account:</span> {employee.bank.account_number}</div>
        <div><span className="text-muted-foreground">IFSC:</span> {employee.bank.ifsc}</div>
      </div>
      {c && (
        <div className="border p-4 rounded text-sm space-y-2">
          <div className="flex justify-between"><h2 className="font-semibold">Compensation (read-only)</h2><span className="font-bold">{c.annual_ctc} {c.currency}</span></div>
          <div className="space-y-1 text-xs text-muted-foreground">{c.components.map((comp) => (<div key={comp.id} className="flex justify-between"><span>{comp.name}</span><span>{comp.annual_amount} {c.currency}</span></div>))}</div>
        </div>
      )}
    </main>
  )
}
