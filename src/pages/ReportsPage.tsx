import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import HeadcountReport from '../components/reports/HeadcountReport'
import JoinersReport from '../components/reports/JoinersReport'
import LeaveReport from '../components/reports/LeaveReport'
import PayrollReport from '../components/reports/PayrollReport'
import { Button } from '../components/ui/button'

const TABS = { Headcount: HeadcountReport, Joiners: JoinersReport, Leave: LeaveReport, Payroll: PayrollReport }
type Tab = keyof typeof TABS

export default function ReportsPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState<Tab>('Headcount')
  if (!session) return null
  const tabs = (Object.keys(TABS) as Tab[]).filter((name) => name !== 'Payroll' || session.user.role === 'HR')
  const Report = TABS[tab]

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <nav className="flex gap-2">
        {tabs.map((name) => <Button key={name} variant={name === tab ? 'default' : 'outline'} onClick={() => setTab(name)}>{name}</Button>)}
      </nav>
      <Report accessToken={session.access_token} />
    </main>
  )
}
