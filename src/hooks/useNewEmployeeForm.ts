import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createEmployee, type CompensationComponentInput } from '../api/employees'
import { listCountries, listDepartments, type Country, type Department } from '../api/settings'
import { useAuth } from '../auth/AuthContext'

export function useNewEmployeeForm() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [countries, setCountries] = useState<Country[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [error, setError] = useState('')
  const [components, setComponents] = useState<CompensationComponentInput[]>([{ name: 'Basic', annual_amount: '' }])
  const [form, setForm] = useState({
    employee_id: '', first_name: '', last_name: '', work_email: '', country: 'India',
    department_id: '', job_title: '', start_date: '', status: 'active' as const,
    bank_name: '', account_number: '', ifsc: '',
  })

  useEffect(() => {
    if (!session) return
    listCountries(session.access_token).then((c) => { setCountries(c); if (c[0]) setForm((f) => ({ ...f, country: c[0].name })) }).catch(() => setError('Could not load countries.'))
    listDepartments(session.access_token).then((d) => { const active = d.filter((i) => i.active); setDepartments(active); if (active[0]) setForm((f) => ({ ...f, department_id: String(active[0].id) })) }).catch(() => setError('Could not load departments.'))
  }, [session])

  const currency = countries.find((c) => c.name === form.country)?.currency ?? 'INR'
  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    try {
      await createEmployee(session.access_token, { ...form, department_id: Number(form.department_id), components })
      navigate('/employees')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create employee.') }
  }

  return { countries, departments, currency, form, set, components, setComponents, error, handleSubmit }
}
