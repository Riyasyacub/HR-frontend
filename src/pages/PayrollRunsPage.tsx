import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createPayrollRun, listPayrollRuns, type PayrollRun } from '../api/payroll'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Card, CardContent } from '../components/ui/card'

const POLL_INTERVAL_MS = 2000

export default function PayrollRunsPage() {
  const { session } = useAuth()
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [month, setMonth] = useState('')
  const [error, setError] = useState('')
  const calculating = runs.some((run) => run.calculation_status === 'queued' || run.calculation_status === 'processing')

  const loadRuns = useCallback(() => {
    if (!session) return
    listPayrollRuns(session.access_token).then((page) => setRuns(page.data)).catch(() => setError('Could not load payroll runs.'))
  }, [session])

  useEffect(loadRuns, [loadRuns])

  useEffect(() => {
    if (!calculating) return
    const timer = setTimeout(loadRuns, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [calculating, runs, loadRuns])

  async function createRun(event: FormEvent) {
    event.preventDefault()
    if (!session || !month) return
    setError('')
    try {
      const run = await createPayrollRun(session.access_token, month)
      setRuns((current) => [run, ...current])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the run.')
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6">
      <PageHeader title="Payroll" description="Create a monthly run, review it, then generate and export." />
      <Card>
        <CardContent>
          <form onSubmit={createRun} className="flex items-center gap-2">
            <input aria-label="Payroll month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm" />
            <Button type="submit" disabled={!month}>Create run</Button>
          </form>
        </CardContent>
      </Card>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader><TableRow><TableHead>Month</TableHead><TableHead>Status</TableHead><TableHead>Calculation</TableHead></TableRow></TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell><Link to={`/payroll/${run.id}`} className="font-medium text-primary hover:underline">{run.month.slice(0, 7)}</Link></TableCell>
                <TableCell><StatusBadge status={run.status} /></TableCell>
                <TableCell><StatusBadge status={run.calculation_status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </main>
  )
}
