import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import HeadcountReport from '../components/reports/HeadcountReport'
import JoinersReport from '../components/reports/JoinersReport'
import LeaveReport from '../components/reports/LeaveReport'
import PayrollReport from '../components/reports/PayrollReport'
import PageHeader from '../components/PageHeader'

const TABS = { Headcount: HeadcountReport, Joiners: JoinersReport, Leave: LeaveReport, Payroll: PayrollReport }
type Tab = keyof typeof TABS

export default function ReportsPage() {
  const { session } = useAuth()
  const [tab, setTab] = useState<Tab>('Headcount')
  if (!session) return null
  const tabs = (Object.keys(TABS) as Tab[]).filter((name) => name !== 'Payroll' || session.user.role === 'HR')
  const Report = TABS[tab]

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6">
      <PageHeader title="Reports" description="Filter, review, and download reports as Excel." />
      <div role="tablist" aria-label="Reports" className="inline-flex rounded-lg bg-muted p-1">
        {tabs.map((name) => (
          <button key={name} type="button" role="tab" aria-selected={name === tab} onClick={() => setTab(name)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${name === tab ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{name}</button>
        ))}
      </div>
      <Report accessToken={session.access_token} />
    </main>
  )
}
