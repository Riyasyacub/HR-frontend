import { useEffect, useState, type FormEvent } from 'react'
import { createDepartment, deactivateDepartment, listCountries, listDepartments, listLeaveTypes, renameDepartment, updateLeaveType, type Country, type Department, type LeaveType } from '../api/settings'
import { useAuth } from '../auth/AuthContext'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

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
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">HR settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">HR-only configuration.</p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card role="region" aria-labelledby="countries-heading">
          <CardHeader>
            <CardTitle id="countries-heading" role="heading" aria-level={2}>Countries</CardTitle>
            <CardDescription>Supported countries and their payroll currency (read-only).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Country</TableHead><TableHead>Currency</TableHead></TableRow></TableHeader>
              <TableBody>
                {countries.map((country) => <TableRow key={country.name}><TableCell>{country.name}</TableCell><TableCell>{country.currency}</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card role="region" aria-labelledby="departments-heading">
          <CardHeader>
            <CardTitle id="departments-heading" role="heading" aria-level={2}>Departments</CardTitle>
            <CardDescription>Add, rename, or deactivate departments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addDepartment} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
              <label className="space-y-1 text-sm">Department name<Input value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} required /></label>
              <label className="space-y-1 text-sm">Department code<Input value={departmentCode} onChange={(event) => setDepartmentCode(event.target.value)} required /></label>
              <Button type="submit">Add department</Button>
            </form>
            {departmentError && <p role="alert" className="text-sm text-destructive">{departmentError}</p>}
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Code</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    {editingDepartment?.id === department.id ? (
                      <TableCell colSpan={4}>
                        <form onSubmit={saveRename} className="flex items-center gap-2">
                          <Input aria-label={`New name for ${department.name}`} value={editingName} onChange={(event) => setEditingName(event.target.value)} required />
                          <Button type="submit" size="sm">Save</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setEditingDepartment(null)}>Cancel</Button>
                        </form>
                      </TableCell>
                    ) : (
                      <>
                        <TableCell className="font-medium">{department.name}</TableCell>
                        <TableCell className="text-muted-foreground">{department.code}</TableCell>
                        <TableCell>{department.active ? <Badge variant="secondary">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                        <TableCell className="text-right">
                          {department.active && <Button type="button" size="sm" variant="ghost" aria-label={`Rename ${department.name}`} onClick={() => { setEditingDepartment(department); setEditingName(department.name) }}>Rename</Button>}
                          {department.active && <Button type="button" size="sm" variant="ghost" aria-label={`Deactivate ${department.name}`} onClick={() => deactivate(department)}>Deactivate</Button>}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <Card role="region" aria-labelledby="leave-types-heading">
        <CardHeader>
          <CardTitle id="leave-types-heading" role="heading" aria-level={2}>Leave types</CardTitle>
          <CardDescription>Default yearly entitlement for balance-tracked leave.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Leave type</TableHead><TableHead>Default entitlement (days)</TableHead></TableRow></TableHeader>
            <TableBody>
              {leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell className="font-medium">{leaveType.name}</TableCell>
                  <TableCell>
                    {leaveType.balance_tracked ? (
                      <form noValidate onSubmit={(event) => saveEntitlement(event, leaveType)} className="flex items-center gap-2">
                        <Input className="w-24" type="number" min="0" step="1" name="entitlement" defaultValue={leaveType.default_entitlement ?? ''} aria-label={`Default entitlement for ${leaveType.name}`} required />
                        <Button type="submit" size="sm" variant="outline">Save {leaveType.name}</Button>
                      </form>
                    ) : <span className="text-muted-foreground">No entitlement</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
