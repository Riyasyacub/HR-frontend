import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { getJoiners, type JoinersPage } from '../../api/reports'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { currentMonthPeriod } from '../../lib/period'
import Pager from '../Pager'
import DownloadReportButton from './DownloadReportButton'

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
      <table className="w-full text-left">
        <thead><tr>{['Employee ID', 'Name', 'Country', 'Department', 'Start date'].map((heading) => <th key={heading} className="p-2">{heading}</th>)}</tr></thead>
        <tbody>
          {joiners?.data.map((joiner) => (
            <tr key={joiner.id} className="border-t">
              <td className="p-2">{joiner.employee_id}</td><td className="p-2"><Link className="underline" to={`/employees/${joiner.id}`}>{joiner.name}</Link></td>
              <td className="p-2">{joiner.country}</td><td className="p-2">{joiner.department}</td><td className="p-2">{joiner.start_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pager page={page} pageCount={pageCount} onPage={setPage} />
    </section>
  )
}
