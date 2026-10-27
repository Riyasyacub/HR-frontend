import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
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
      <div className="mt-4">
        <Link to="/leave-records" className="text-sm underline">Leave records</Link>
      </div>
      {isHr && (
        <div className="mt-4">
          <Link to="/leave-upload" className="text-sm underline">Leave upload</Link>
          <Link to="/payroll" className="text-sm underline ml-4">Payroll</Link>
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
