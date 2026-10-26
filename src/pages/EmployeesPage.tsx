import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEmployees, type EmployeeSummary } from '../api/employees'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'

export default function EmployeesPage() {
  const { session } = useAuth()
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    listEmployees(session.access_token).then((res) => setEmployees(res.data)).catch(() => setError('Could not load employees.'))
  }, [session])

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <Button asChild><Link to="/employees/new">Add employee</Link></Button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Email</th>
              <th className="p-2">Department</th><th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b">
                <td className="p-2 font-mono">{emp.employee_id}</td>
                <td className="p-2"><Link to={`/employees/${emp.id}`} className="underline">{emp.first_name} {emp.last_name}</Link></td>
                <td className="p-2">{emp.work_email}</td>
                <td className="p-2">{emp.department.name}</td>
                <td className="p-2">{emp.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
