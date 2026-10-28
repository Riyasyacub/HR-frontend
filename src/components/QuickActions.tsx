import { Link } from 'react-router-dom'
import { Card, CardContent } from './ui/card'

type Props = { isHr: boolean; isManager: boolean; employeeId: number | null | undefined }

export default function QuickActions({ isHr, isManager, employeeId }: Props) {
  const actions = isHr
    ? [['Import employees', '/employee-import'], ['Upload leave', '/leave-upload'], ['Create payroll run', '/payroll'], ['View reports', '/reports']]
    : isManager
      ? [['Open org chart', '/org-chart'], ['View my team', '/team'], ['View reports', '/reports']]
      : [['View my leave', '/leave-records'], ...(employeeId ? [['My profile', `/employees/${employeeId}`]] : [])]

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">Quick actions</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(([label, to]) => (
          <Card key={to} className="transition-colors hover:border-primary">
            <CardContent><Link to={to} className="font-medium text-primary">{label}</Link></CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
