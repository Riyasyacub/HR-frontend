import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTeam, type EmployeeSummary } from '../api/employees'
import { useAuth } from '../auth/AuthContext'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

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
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <PageHeader title="My team" description="Everyone in your reporting line." />
      {team.length === 0 ? (
        <p className="text-sm text-muted-foreground">You do not have any team members yet.</p>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Job title</TableHead><TableHead>Department</TableHead><TableHead>Country</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {team.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell><Link to={`/employees/${employee.id}`} className="font-medium text-primary hover:underline">{employee.first_name} {employee.last_name} ({employee.employee_id})</Link></TableCell>
                  <TableCell>{employee.job_title}</TableCell>
                  <TableCell>{employee.department.name}</TableCell>
                  <TableCell>{employee.country}</TableCell>
                  <TableCell><StatusBadge status={employee.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  )
}
