import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/button'

export default function DashboardPage() {
  const { session, signOut } = useAuth()
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">{session?.user.role === 'HR' ? 'HR dashboard' : 'Employee dashboard'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{session?.user.name}</p>
      <Button className="mt-6" variant="outline" onClick={() => void signOut().catch(() => undefined)}>Sign out</Button>
    </main>
  )
}
