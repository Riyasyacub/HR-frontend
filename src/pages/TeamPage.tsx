import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTeam, type EmployeeSummary } from '../api/employees'
import { useAuth } from '../auth/AuthContext'

export default function TeamPage() {
  const { session } = useAuth()
  const [team, setTeam] = useState<EmployeeSummary[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session) return
    getTeam(session.access_token)
      .then(setTeam)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load team.'))
  }, [session])

  if (error) return <main className="p-6"><p role="alert" className="text-sm text-red-600">{error}</p></main>
  if (!team) return <main className="p-6">Loading…</main>

  return (
    <main className="p-6 max-w-3xl space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">My team</h1>
        <Link to="/dashboard" className="text-sm underline">Back to dashboard</Link>
      </div>
      {team.length === 0 ? (
        <p className="text-sm text-muted-foreground">You do not have any team members yet.</p>
      ) : (
        <ul className="space-y-3 border rounded p-4">
          {team.map((employee) => (
            <li key={employee.id} className="border-b last:border-none pb-3 last:pb-0">
              <div className="flex justify-between">
                <Link
                  to={`/employees/${employee.id}`}
                  className="text-base font-medium hover:underline"
                >
                  {employee.first_name} {employee.last_name} ({employee.employee_id})
                </Link>
                <span className="text-xs px-2 py-0.5 border rounded">{employee.status}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1 space-x-3">
                <span>{employee.job_title}</span>
                <span>{employee.department.name}</span>
                <span>{employee.country}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
