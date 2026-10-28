import { useEffect, useState, type FormEvent } from 'react'
import { getHeadcount, type HeadcountReport as Report } from '../../api/reports'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import DownloadReportButton from './DownloadReportButton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

export default function HeadcountReport({ accessToken }: { accessToken: string }) {
  const [draft, setDraft] = useState({ group_by: 'country', country: '' })
  const [params, setParams] = useState(draft)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getHeadcount(accessToken, params).then(setReport).catch(() => setError('Could not load the headcount report.'))
  }, [accessToken, params])

  function apply(event: FormEvent) {
    event.preventDefault()
    setError('')
    setParams(draft)
  }

  return (
    <section className="space-y-3 text-sm">
      <form onSubmit={apply} className="flex items-end gap-2">
        <label className="flex flex-col">Group by
          <select className="border rounded p-2" value={draft.group_by} onChange={(event) => setDraft({ ...draft, group_by: event.target.value })}>
            {['country', 'department', 'manager'].map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </label>
        <label className="flex flex-col">Country
          <Input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} />
        </label>
        <Button type="submit">Apply</Button>
        <DownloadReportButton accessToken={accessToken} report="headcount" params={params} />
      </form>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      <div className="rounded-xl border bg-card shadow-sm"><Table>
        <TableHeader><TableRow><TableHead>Group</TableHead><TableHead>Headcount</TableHead></TableRow></TableHeader>
        <TableBody>
          {report?.data.map((row) => <TableRow key={row.group}><TableCell>{row.group}</TableCell><TableCell>{row.headcount}</TableCell></TableRow>)}
          {report && <TableRow className="font-semibold"><TableCell>Total</TableCell><TableCell>{report.meta.headcount}</TableCell></TableRow>}
        </TableBody>
      </Table></div>
    </section>
  )
}
