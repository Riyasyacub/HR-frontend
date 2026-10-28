import CompensationInputs from '../components/CompensationInputs'
import PageHeader from '../components/PageHeader'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useNewEmployeeForm } from '../hooks/useNewEmployeeForm'

export default function NewEmployeePage() {
  const { countries, departments, currency, form, set, components, setComponents, error, handleSubmit } = useNewEmployeeForm()

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <PageHeader title="New employee" description="Profile, bank details, and compensation components." />
      {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Employee ID" value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} required />
          <Input placeholder="Job title" value={form.job_title} onChange={(e) => set('job_title', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="First name" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} required />
          <Input placeholder="Last name" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} required />
        </div>
        <Input type="email" placeholder="Work email" value={form.work_email} onChange={(e) => set('work_email', e.target.value)} required />
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Country" value={form.country} onChange={(e) => set('country', e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
            {countries.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <select aria-label="Department" value={form.department_id} onChange={(e) => set('department_id', e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" aria-label="Start date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} required />
          <select aria-label="Status" value={form.status} onChange={(e) => set('status', e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm">
            <option value="active">Active</option><option value="onboarding">Onboarding</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Bank name" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} required />
          <Input placeholder="Account number" value={form.account_number} onChange={(e) => set('account_number', e.target.value)} required />
          <Input placeholder="IFSC" value={form.ifsc} onChange={(e) => set('ifsc', e.target.value)} required />
        </div>
        <CompensationInputs currency={currency} components={components} onChange={setComponents} />
        <Button type="submit">Create employee</Button>
      </form>
    </main>
  )
}
