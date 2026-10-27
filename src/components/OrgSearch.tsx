import { useState, type FormEvent } from 'react'
import { listEmployees, type EmployeeSummary } from '../api/employees'
import { Button } from './ui/button'
import { Input } from './ui/input'

export default function OrgSearch({ accessToken, onSelect }: { accessToken: string; onSelect: (employeeId: number) => void }) {
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<EmployeeSummary[]>([])

  async function search(event: FormEvent) {
    event.preventDefault()
    const page = await listEmployees(accessToken, 1, 10, `search=${encodeURIComponent(query.trim())}`).catch(() => null)
    setMatches(page?.data ?? [])
  }

  return (
    <div className="space-y-1 text-sm">
      <form onSubmit={search} className="flex items-end gap-2">
        <label className="flex flex-col">Find employee<Input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <Button type="submit" disabled={!query.trim()}>Find</Button>
      </form>
      <div className="flex flex-wrap gap-2">
        {matches.map((employee) => (
          <Button key={employee.id} variant="outline" onClick={() => { setMatches([]); onSelect(employee.id) }}>
            {employee.first_name} {employee.last_name} ({employee.employee_id})
          </Button>
        ))}
      </div>
    </div>
  )
}
