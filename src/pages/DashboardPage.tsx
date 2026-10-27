import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import DashboardTiles from '../components/DashboardTiles'
import { Button } from '../components/ui/button'

export default function DashboardPage() {
  const { session, signOut } = useAuth()
  const isHr = session?.user.role === 'HR'
  const isManager = Boolean(session?.user.is_manager)
  const heading = isHr ? 'HR dashboard' : isManager ? 'Manager dashboard' : 'Employee dashboard'

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">{heading}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{session?.user.name}</p>
      {session && (isHr || isManager) && <DashboardTiles accessToken={session.access_token} isHr={isHr} />}
      <div className="mt-4">
        <Link to="/leave-records" className="text-sm underline">Leave records</Link>
        {(isHr || isManager) && <Link to="/reports" className="text-sm underline ml-4">Reports</Link>}
        {(isHr || isManager) && <Link to="/org-chart" className="text-sm underline ml-4">Org chart</Link>}
      </div>
      {isHr && (
        <div className="mt-4">
          <Link to="/employees" className="text-sm underline">Employees</Link>
          <Link to="/leave-upload" className="text-sm underline ml-4">Leave upload</Link>
          <Link to="/employee-import" className="text-sm underline ml-4">Employee import</Link>
          <Link to="/payroll" className="text-sm underline ml-4">Payroll</Link>
          <Link to="/settings" className="text-sm underline ml-4">Settings</Link>
        </div>
      )}
      {isManager && (
        <div className="mt-4">
          <Link to="/team" className="text-sm underline">My team</Link>
        </div>
      )}
      <Button className="mt-6" variant="outline" onClick={() => void signOut().catch(() => undefined)}>Sign out</Button>
    </main>
  )
}
