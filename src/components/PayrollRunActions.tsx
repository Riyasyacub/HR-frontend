import { useState } from 'react'
import { downloadPayrollExport, generatePayrollRun, markPayrollRunPaid, type PayrollRun } from '../api/payroll'
import { Button } from './ui/button'
import { Input } from './ui/input'

type Props = { accessToken: string; run: PayrollRun; blockingIssues: number; onChange: (run: PayrollRun) => void }

export default function PayrollRunActions({ accessToken, run, blockingIssues, onChange }: Props) {
  const [paidOn, setPaidOn] = useState('')
  const [error, setError] = useState('')

  async function attempt(action: () => Promise<void>) {
    setError('')
    try { await action() } catch (err) { setError(err instanceof Error ? err.message : 'Action failed.') }
  }

  const download = () => attempt(async () => {
    const url = URL.createObjectURL(await downloadPayrollExport(accessToken, run.id))
    Object.assign(document.createElement('a'), { href: url, download: `payroll-${run.month.slice(0, 7)}.xlsx` }).click()
    URL.revokeObjectURL(url)
  })

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {run.status === 'draft' && (
        <Button disabled={run.calculation_status !== 'completed' || blockingIssues > 0}
          onClick={() => void attempt(async () => onChange(await generatePayrollRun(accessToken, run.id)))}>Generate</Button>
      )}
      {run.status !== 'draft' && <Button variant="outline" onClick={() => void download()}>Download XLSX</Button>}
      {run.status === 'generated' && (
        <>
          <label htmlFor="paid-on">Paid on</label>
          <Input id="paid-on" type="date" className="w-40" value={paidOn} onChange={(event) => setPaidOn(event.target.value)} />
          <Button disabled={!paidOn} onClick={() => void attempt(async () => onChange(await markPayrollRunPaid(accessToken, run.id, paidOn)))}>Mark paid</Button>
        </>
      )}
      {run.status === 'paid' && <span>Paid on {run.paid_on}</span>}
      {error && <p role="alert" className="w-full text-red-600">{error}</p>}
    </div>
  )
}
