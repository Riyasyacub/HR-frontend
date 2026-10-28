import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getJoiners, type JoinersPage } from '../../api/reports'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { currentMonthPeriod } from '../../lib/period'
import Pager from '../Pager'
import DownloadReportButton from './DownloadReportButton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export default function JoinersReport({ accessToken }: { accessToken: string }) {
  const [draft, setDraft] = useState(() => ({ ...currentMonthPeriod(), country: '' }))
  const [params, setParams] = useState(draft)
  const [page, setPage] = useState(1)
  const [joiners, setJoiners] = useState<JoinersPage | null>(null)
  const [error, setError] = useState('')
  const pageCount = joiners ? Math.max(1, Math.ceil(joiners.meta.total / joiners.meta.per_page)) : 1

  useEffect(() => {
    getJoiners(accessToken, params, page).then(setJoiners).catch((err) => setError(err instanceof Error ? err.message : 'Could not load joiners.'))
  }, [accessToken, params, page])

  function apply(event: FormEvent) {
    event.preventDefault()
    setError('')
    setPage(1)
    setParams(draft)
  }

  const field = (label: string, key: keyof typeof draft, type = 'text') => (
    <label className="flex flex-col">{label}<Input type={type} value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>
  )

  return (
    <section className="space-y-3 text-sm">
      <form onSubmit={apply} className="flex items-end gap-2">
        {field('From', 'from', 'date')}{field('To', 'to', 'date')}{field('Country', 'country')}
        <Button type="submit">Apply</Button>
        <DownloadReportButton accessToken={accessToken} report="joiners" params={params} />
      </form>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="rounded-xl border bg-card shadow-sm"><Table>
        <TableHeader><TableRow>{['Employee ID', 'Name', 'Country', 'Department', 'Start date'].map((heading) => <TableHead key={heading}>{heading}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {joiners?.data.map((joiner) => (
            <TableRow key={joiner.id}>
              <TableCell>{joiner.employee_id}</TableCell><TableCell><Link className="font-medium text-primary hover:underline" to={`/employees/${joiner.id}`}>{joiner.name}</Link></TableCell>
              <TableCell>{joiner.country}</TableCell><TableCell>{joiner.department}</TableCell><TableCell>{joiner.start_date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></div>
      <Pager page={page} pageCount={pageCount} onPage={setPage} />
    </section>
  )
}
