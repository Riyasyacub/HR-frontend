import { useEffect, useState } from 'react'
import { listPayrollLines, type PayrollLinePage } from '../api/payroll'
import { Button } from './ui/button'

const HEADINGS = ['Employee', 'Currency', 'Gross', 'Working days', 'Unpaid days', 'Unpaid deduction', 'Total', 'Issues']

export default function PayrollLinesTable({ accessToken, runId }: { accessToken: string; runId: number }) {
  const [page, setPage] = useState(1)
  const [issuesOnly, setIssuesOnly] = useState(false)
  const [lines, setLines] = useState<PayrollLinePage | null>(null)
  const [error, setError] = useState('')
  const pageCount = lines ? Math.max(1, Math.ceil(lines.meta.total / lines.meta.per_page)) : 1

  useEffect(() => {
    listPayrollLines(accessToken, runId, page, issuesOnly).then(setLines).catch(() => setError('Could not load payroll lines.'))
  }, [accessToken, runId, page, issuesOnly])

  return (
    <section className="space-y-2 text-sm">
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={issuesOnly} onChange={(event) => { setIssuesOnly(event.target.checked); setPage(1) }} />
        Issues only
      </label>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <table className="w-full text-left">
        <thead><tr>{HEADINGS.map((heading) => <th key={heading} className="p-2">{heading}</th>)}</tr></thead>
        <tbody>
          {lines?.data.map((line) => (
            <tr key={line.id} className="border-t">
              {[`${line.employee.name} (${line.employee.employee_id})`, line.currency, line.monthly_gross, line.working_days, line.unpaid_days,
                line.unpaid_deduction, line.total, line.blocking_issues.join(', ')].map((value, index) => <td key={index} className="p-2">{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <span>Page {page} of {pageCount}</span>
        <Button variant="outline" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </section>
  )
}
