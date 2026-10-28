import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPayrollRun, recalculatePayrollRun, type PayrollRunDetail } from '../api/payroll'
import { useAuth } from '../auth/AuthContext'
import PayrollLinesTable from '../components/PayrollLinesTable'
import PayrollRunActions from '../components/PayrollRunActions'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

const POLL_INTERVAL_MS = 2000

export default function PayrollRunPage() {
  const { session } = useAuth()
  const id = Number(useParams().id)
  const [run, setRun] = useState<PayrollRunDetail | null>(null)
  const [error, setError] = useState('')
  const calculating = run?.calculation_status === 'queued' || run?.calculation_status === 'processing'

  const loadRun = useCallback(() => {
    if (session) getPayrollRun(session.access_token, id).then(setRun).catch(() => setError('Could not load the payroll run.'))
  }, [session, id])

  useEffect(loadRun, [loadRun])

  useEffect(() => {
    if (!calculating) return
    const timer = setTimeout(loadRun, POLL_INTERVAL_MS)
    return () => clearTimeout(timer)
  }, [calculating, run, loadRun])

  async function recalculate() {
    if (!session || !run) return
    try {
      const queued = await recalculatePayrollRun(session.access_token, id)
      setRun({ ...run, calculation_status: queued.calculation_status })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not recalculate.')
    }
  }

  if (!run) return <main className="p-6">{error ? <p role="alert" className="text-sm text-red-600">{error}</p> : 'Loading…'}</main>
  const issues = run.blocking_issues_count

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-6">
      <PageHeader title={`Payroll ${run.month.slice(0, 7)}`} description={`${run.status} · ${run.calculation_status}`}
        actions={run.status === 'draft' && <Button variant="outline" disabled={calculating} onClick={() => void recalculate()}>Recalculate</Button>} />
      {session && <div className="rounded-xl border bg-card p-4 shadow-sm"><PayrollRunActions accessToken={session.access_token} run={run} blockingIssues={issues} onChange={(updated) => setRun({ ...run, ...updated })} /></div>}
      {(error || run.calculation_status === 'failed') && <p role="alert" className="text-sm text-red-600">{error || `Calculation failed: ${run.calculation_error}`}</p>}
      <p className={issues ? 'text-sm text-red-600' : 'text-sm'}>
        {issues ? `${issues} ${issues === 1 ? 'employee has' : 'employees have'} blocking issues and must be fixed before export.` : 'No blocking issues.'}
      </p>
      <div className="rounded-xl border bg-card shadow-sm"><Table>
        <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Currency</TableHead><TableHead>Employees</TableHead><TableHead>Gross</TableHead><TableHead>Unpaid deduction</TableHead><TableHead>Total</TableHead></TableRow></TableHeader>
        <TableBody>
          {run.totals.map((total) => (
            <TableRow key={`${total.country}-${total.currency}`}>
              {[total.country, total.currency, total.employees, total.monthly_gross, total.unpaid_deduction, total.total].map((value, index) => <TableCell key={index}>{value}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
      {session && run.calculation_status === 'completed' && <PayrollLinesTable accessToken={session.access_token} runId={id} />}
    </main>
  )
}
