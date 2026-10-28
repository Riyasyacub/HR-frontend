import { lazy, Suspense } from 'react'
import { useAuth } from '../auth/AuthContext'
import DashboardTiles from '../components/DashboardTiles'
import QuickActions from '../components/QuickActions'

const DashboardTrends = lazy(() => import('../components/DashboardTrends'))

export default function DashboardPage() {
  const { session } = useAuth()
  const isHr = session?.user.role === 'HR'
  const isManager = Boolean(session?.user.is_manager)
  const heading = isHr ? 'HR dashboard' : isManager ? 'Manager dashboard' : 'Employee dashboard'

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Welcome back, {session?.user.name.split(' ')[0]}</p>
      {session && (isHr || isManager) && <DashboardTiles accessToken={session.access_token} isHr={isHr} />}
      {session && (isHr || isManager) && <Suspense fallback={null}><DashboardTrends accessToken={session.access_token} isHr={isHr} /></Suspense>}
      <QuickActions isHr={isHr} isManager={isManager} employeeId={session?.user.employee_id} />
    </main>
  )
}
