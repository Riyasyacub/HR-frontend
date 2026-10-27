import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPayrollRun, recalculatePayrollRun, type PayrollRunDetail } from '../api/payroll'
import { useAuth } from '../auth/AuthContext'
import PayrollLinesTable from '../components/PayrollLinesTable'
import PayrollRunActions from '../components/PayrollRunActions'
import { Button } from '../components/ui/button'

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
    <main className="p-6 max-w-3xl space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Payroll {run.month.slice(0, 7)}</h1>
        {run.status === 'draft' && <Button variant="outline" disabled={calculating} onClick={() => void recalculate()}>Recalculate</Button>}
      </div>
      <p className="text-sm text-muted-foreground">{run.status} · {run.calculation_status}</p>
      {session && <PayrollRunActions accessToken={session.access_token} run={run} blockingIssues={issues} onChange={(updated) => setRun({ ...run, ...updated })} />}
      {(error || run.calculation_status === 'failed') && <p role="alert" className="text-sm text-red-600">{error || `Calculation failed: ${run.calculation_error}`}</p>}
      <p className={issues ? 'text-sm text-red-600' : 'text-sm'}>
        {issues ? `${issues} ${issues === 1 ? 'employee has' : 'employees have'} blocking issues and must be fixed before export.` : 'No blocking issues.'}
      </p>
      <table className="w-full text-sm text-left">
        <thead><tr><th className="p-2">Country</th><th className="p-2">Currency</th><th className="p-2">Employees</th><th className="p-2">Gross</th><th className="p-2">Unpaid deduction</th><th className="p-2">Total</th></tr></thead>
        <tbody>
          {run.totals.map((total) => (
            <tr key={`${total.country}-${total.currency}`} className="border-t">
              {[total.country, total.currency, total.employees, total.monthly_gross, total.unpaid_deduction, total.total].map((value, index) => <td key={index} className="p-2">{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {session && run.calculation_status === 'completed' && <PayrollLinesTable accessToken={session.access_token} runId={id} />}
    </main>
  )
}
