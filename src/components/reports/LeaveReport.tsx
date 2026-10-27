import { useEffect, useState, type FormEvent } from 'react'
import { getLeaveReport, type LeaveBalance, type LeaveReportPage } from '../../api/reports'
import Pager from '../Pager'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import DownloadReportButton from './DownloadReportButton'

const cells = (balances: LeaveBalance[], unpaidDays: number) =>
  [...balances.flatMap((balance) => [balance.entitled, balance.used, balance.remaining]), unpaidDays].map((value, index) => <td key={index} className="p-2">{value}</td>)

export default function LeaveReport({ accessToken }: { accessToken: string }) {
  const [draft, setDraft] = useState(() => ({ year: String(new Date().getFullYear()), country: '' }))
  const [params, setParams] = useState(draft)
  const [page, setPage] = useState(1)
  const [report, setReport] = useState<LeaveReportPage | null>(null)
  const [error, setError] = useState('')
  const pageCount = report ? Math.max(1, Math.ceil(report.meta.total / report.meta.per_page)) : 1
  const types = report?.meta.totals.balances.map((balance) => balance.leave_type) ?? []

  useEffect(() => {
    getLeaveReport(accessToken, params, page).then(setReport).catch(() => setError('Could not load the leave report.'))
  }, [accessToken, params, page])

  function apply(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPage(1)
    setParams(draft)
  }

  return (
    <section className="space-y-3 text-sm">
      <form onSubmit={apply} className="flex items-end gap-2">
        <label className="flex flex-col">Year<Input value={draft.year} onChange={(event) => setDraft({ ...draft, year: event.target.value })} /></label>
        <label className="flex flex-col">Country<Input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} /></label>
        <Button type="submit">Apply</Button>
        <DownloadReportButton accessToken={accessToken} report="leave" params={params} />
      </form>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <table className="w-full text-left">
        <thead><tr>{['Employee ID', 'Name', ...types.flatMap((type) => ['entitled', 'used', 'remaining'].map((part) => `${type} ${part}`)), 'Unpaid days'].map((heading) => <th key={heading} className="p-2">{heading}</th>)}</tr></thead>
        <tbody>
          {report?.data.map((row) => <tr key={row.id} className="border-t"><td className="p-2">{row.employee_id}</td><td className="p-2">{row.name}</td>{cells(row.balances, row.unpaid_days)}</tr>)}
          {report && <tr className="border-t font-semibold"><td className="p-2" colSpan={2}>Total</td>{cells(report.meta.totals.balances, report.meta.totals.unpaid_days)}</tr>}
        </tbody>
      </table>
      <Pager page={page} pageCount={pageCount} onPage={setPage} />
    </section>
  )
}
