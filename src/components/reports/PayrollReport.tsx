import { useEffect, useState, type FormEvent } from 'react'
import { getPayrollReport, type PayrollReport as Report } from '../../api/reports'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import DownloadReportButton from './DownloadReportButton'

const HEADINGS = ['Month', 'Country', 'Currency', 'Employees', 'Monthly gross', 'Unpaid deduction', 'Total']

export default function PayrollReport({ accessToken }: { accessToken: string }) {
  const [draft, setDraft] = useState(() => ({ year: String(new Date().getFullYear()), country: '' }))
  const [params, setParams] = useState(draft)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPayrollReport(accessToken, params).then(setReport).catch(() => setError('Could not load the payroll report.'))
  }, [accessToken, params])

  function apply(event: FormEvent) {
    event.preventDefault()
    setError('')
    setParams(draft)
  }

  return (
    <section className="space-y-3 text-sm">
      <form onSubmit={apply} className="flex items-end gap-2">
        <label className="flex flex-col">Year<Input value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} /></label>
        <label className="flex flex-col">Country<Input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} /></label>
        <Button type="submit">Apply</Button>
        <DownloadReportButton accessToken={accessToken} report="payroll" params={params} />
      </form>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {report?.data.length === 0 && <p className="text-muted-foreground">No generated payroll runs for this year.</p>}
      <table className="w-full text-left">
        <thead><tr>{HEADINGS.map((heading) => <th key={heading} className="p-2">{heading}</th>)}</tr></thead>
        <tbody>
          {report?.data.map((row) => (
            <tr key={`${row.month}-${row.country}-${row.currency}`} className="border-t">
              {[row.month, row.country, row.currency, row.employees, row.monthly_gross, row.unpaid_deduction, row.total].map((value, index) => <td key={index} className="p-2">{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
