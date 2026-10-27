import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listEmployees, type EmployeeSummary } from '../api/employees'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import { listDepartments, type Department } from '../api/settings'

export default function EmployeesPage() {
  const { session } = useAuth()
  const [employees, setEmployees] = useState<EmployeeSummary[]>([])
  const [error, setError] = useState('')
  const [departments, setDepartments] = useState<Department[]>([])
  const [managers, setManagers] = useState<EmployeeSummary[]>([])

  const [filter, setFilter] = useState({ country: '', department_id: '', manager_id: '', status: '', search: '' })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    if (!session) return
    if (session.user.role === 'HR') {
      listDepartments(session.access_token).then(setDepartments).catch(() => setDepartments([]))
      listEmployees(session.access_token, 1, 100, 'managers_only=true').then((res) => setManagers(res.data)).catch(() => setManagers([]))
    }
  }, [session])

  useEffect(() => {
    if (!session) return
    const q = []
    if (filter.country) q.push(`country=${encodeURIComponent(filter.country)}`)
    if (filter.department_id) q.push(`department_id=${encodeURIComponent(filter.department_id)}`)
    if (filter.manager_id) q.push(`manager_id=${encodeURIComponent(filter.manager_id)}`)
    if (filter.status) q.push(`status=${encodeURIComponent(filter.status)}`)
    if (debouncedSearch) q.push(`search=${encodeURIComponent(debouncedSearch)}`)
    const queryStr = q.length ? q.join('&') : ''
    listEmployees(session.access_token, 1, 100, queryStr).then((res) => setEmployees(res.data)).catch(() => setError('Could not load employees.'))
  }, [session, filter.country, filter.department_id, filter.manager_id, filter.status, debouncedSearch])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(filter.search), 300)
    return () => clearTimeout(t)
  }, [filter.search])

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        {session?.user.role === 'HR' && <Button asChild><Link to="/employees/new">Add employee</Link></Button>}
      </div>
      <div className="flex gap-2 mt-4 flex-wrap">
        <input aria-label="Search" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} placeholder="Search" className="border rounded p-1.5 text-sm" />
        <input aria-label="Country" value={filter.country} onChange={(e) => setFilter({ ...filter, country: e.target.value })} placeholder="Country" className="border rounded p-1.5 text-sm w-28" />
        {session?.user.role === 'HR' && (
          <select aria-label="Department" value={filter.department_id} onChange={(e) => setFilter({ ...filter, department_id: e.target.value })} className="border rounded p-1.5 text-sm">
            <option value="">All departments</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        {session?.user.role === 'HR' && (
          <select aria-label="Manager" value={filter.manager_id} onChange={(e) => setFilter({ ...filter, manager_id: e.target.value })} className="border rounded p-1.5 text-sm">
            <option value="">All managers</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
          </select>
        )}
        <select aria-label="Status" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })} className="border rounded p-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="onboarding">onboarding</option>
          <option value="active">active</option>
        </select>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 border rounded-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left">
              <th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Email</th>
              <th className="p-2">Department</th><th className="p-2">Manager</th><th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-b">
                <td className="p-2 font-mono">{emp.employee_id}</td>
                <td className="p-2"><Link to={`/employees/${emp.id}`} className="underline">{emp.first_name} {emp.last_name}</Link></td>
                <td className="p-2">{emp.work_email}</td>
                <td className="p-2">{emp.department.name}</td>
                <td className="p-2">{emp.manager?.name ?? '—'}</td>
                <td className="p-2">{emp.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
