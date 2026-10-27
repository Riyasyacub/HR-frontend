import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { createPayrollRun, listPayrollRuns, type PayrollRun } from '../api/payroll'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'

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
    <main className="p-6 max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Payroll</h1>
      <form onSubmit={createRun} className="flex gap-2 items-center">
        <input aria-label="Payroll month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded p-1.5 text-sm" />
        <Button type="submit" disabled={!month}>Create run</Button>
      </form>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <table className="w-full text-sm text-left">
        <thead><tr><th className="p-2">Month</th><th className="p-2">Status</th><th className="p-2">Calculation</th></tr></thead>
        <tbody>
          {runs.map((run) => (
            <tr key={run.id} className="border-t">
              <td className="p-2"><Link to={`/payroll/${run.id}`} className="underline">{run.month.slice(0, 7)}</Link></td>
              <td className="p-2">{run.status}</td>
              <td className="p-2">{run.calculation_status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
