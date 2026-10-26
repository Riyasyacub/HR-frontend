import { useEffect, useState, type FormEvent } from 'react'
import { createDepartment, deactivateDepartment, listCountries, listDepartments, listLeaveTypes, renameDepartment, updateLeaveType, type Country, type Department, type LeaveType } from '../api/settings'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function SettingsPage() {
  const { session } = useAuth()
  const [countries, setCountries] = useState<Country[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [departmentName, setDepartmentName] = useState('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')
  const [departmentError, setDepartmentError] = useState('')

  useEffect(() => {
    if (!session) return
    Promise.all([listCountries(session.access_token), listDepartments(session.access_token), listLeaveTypes(session.access_token)])
      .then(([nextCountries, nextDepartments, nextLeaveTypes]) => {
        setCountries(nextCountries)
        setDepartments(nextDepartments)
        setLeaveTypes(nextLeaveTypes)
      })
      .catch(() => setError('Could not load settings.'))
  }, [session])

  async function addDepartment(event: FormEvent) {
    event.preventDefault()
    if (!session) return
    try {
      const department = await createDepartment(session.access_token, departmentName, departmentCode)
      setDepartments((current) => [...current, department].sort((left, right) => left.name.localeCompare(right.name)))
      setDepartmentName('')
      setDepartmentCode('')
      setDepartmentError('')
    } catch (error) {
      setDepartmentError(error instanceof Error ? error.message : 'Could not create department.')
    }
  }

  async function saveRename(event: FormEvent) {
    event.preventDefault()
    if (!session || !editingDepartment) return
    try {
      const updated = await renameDepartment(session.access_token, editingDepartment.id, editingName)
      setDepartments((current) => current.map((department) => department.id === updated.id ? updated : department))
      setEditingDepartment(null)
      setEditingName('')
      setDepartmentError('')
    } catch (error) {
      setDepartmentError(error instanceof Error ? error.message : 'Could not rename department.')
    }
  }

  async function deactivate(department: Department) {
    if (!session) return
    try {
      const updated = await deactivateDepartment(session.access_token, department.id)
      setDepartments((current) => current.map((item) => item.id === updated.id ? updated : item))
      setDepartmentError('')
    } catch (error) {
      setDepartmentError(error instanceof Error ? error.message : 'Could not deactivate department.')
    }
  }

  async function saveEntitlement(event: FormEvent<HTMLFormElement>, leaveType: LeaveType) {
    event.preventDefault()
    if (!session) return
    const raw = String(new FormData(event.currentTarget).get('entitlement') ?? '')
    const entitlement = Number(raw)
    if (!raw.trim() || !Number.isInteger(entitlement) || entitlement < 0) {
      setError('Default entitlement must be a non-negative whole number.')
      return
    }
    try {
      const updated = await updateLeaveType(session.access_token, leaveType.id, entitlement)
      setLeaveTypes((current) => current.map((item) => item.id === updated.id ? updated : item))
      setError('')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not update entitlement.')
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">HR settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">HR-only configuration.</p>
      {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      <section aria-labelledby="countries-heading" className="mt-6">
        <h2 id="countries-heading" className="text-lg font-medium">Countries</h2>
        <dl className="mt-3 grid max-w-md grid-cols-2 gap-2 text-sm">
          {countries.map((country) => (
            <div key={country.name} className="contents">
              <dt>{country.name}</dt>
              <dd>{country.currency}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section aria-labelledby="departments-heading" className="mt-8">
        <h2 id="departments-heading" className="text-lg font-medium">Departments</h2>
        <form onSubmit={addDepartment} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="text-sm">Department name<Input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} required /></label>
          <label className="text-sm">Department code<Input value={departmentCode} onChange={(event) => setDepartmentCode(event.target.value)} required /></label>
          <Button type="submit">Add department</Button>
        </form>
        {departmentError && <p role="alert" className="mt-3 text-sm text-destructive">{departmentError}</p>}
        <ul className="mt-3 space-y-1 text-sm">
          {departments.map((department) => (
            <li key={department.id} className="flex items-center gap-2">
              {editingDepartment?.id === department.id ? (
                <form onSubmit={saveRename} className="flex items-center gap-2">
                  <Input aria-label={`New name for ${department.name}`} value={editingName} onChange={(event) => setEditingName(event.target.value)} required />
                  <Button type="submit" size="sm">Save</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setEditingDepartment(null)}>Cancel</Button>
                </form>
              ) : (
                <>
                  <span>{department.name}</span> <span>({department.code})</span>
                  {!department.active && <span className="ml-2 text-muted-foreground">Inactive</span>}
                  {department.active && <Button type="button" size="sm" variant="ghost" aria-label={`Rename ${department.name}`} onClick={() => { setEditingDepartment(department); setEditingName(department.name) }}>Rename</Button>}
                  {department.active && <Button type="button" size="sm" variant="ghost" aria-label={`Deactivate ${department.name}`} onClick={() => deactivate(department)}>Deactivate</Button>}
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="leave-types-heading" className="mt-8">
        <h2 id="leave-types-heading" className="text-lg font-medium">Leave types</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {leaveTypes.map((leaveType) => (
            <li key={leaveType.id} className="flex items-center gap-2">
              <span>{leaveType.name}</span>
              {leaveType.balance_tracked ? <form noValidate onSubmit={(event) => saveEntitlement(event, leaveType)} className="flex items-center gap-2"><label className="flex items-center gap-2">Default entitlement<Input type="number" min="0" step="1" name="entitlement" defaultValue={leaveType.default_entitlement ?? ''} aria-label={`Default entitlement for ${leaveType.name}`} required /></label><Button type="submit" size="sm">Save {leaveType.name}</Button></form> : <span className="text-muted-foreground">No entitlement</span>}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
