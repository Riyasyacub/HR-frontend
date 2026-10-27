import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPayrollRuns, type PayrollRun } from '../api/payroll'
import { getHeadcount, getJoiners } from '../api/reports'
import { currentMonthPeriod } from '../lib/period'

type Tile = { label: string; value: string; to: string }

export default function DashboardTiles({ accessToken, isHr }: { accessToken: string; isHr: boolean }) {
  const [headcount, setHeadcount] = useState<{ headcount: number; onboarding: number } | null>(null)
  const [joiners, setJoiners] = useState<number | null>(null)
  const [latestRun, setLatestRun] = useState<PayrollRun | null | undefined>(undefined)

  useEffect(() => {
    getHeadcount(accessToken, { group_by: 'country' }).then((report) => setHeadcount(report.meta)).catch(() => undefined)
    getJoiners(accessToken, currentMonthPeriod(), 1).then((page) => setJoiners(page.meta.total)).catch(() => undefined)
    if (isHr) listPayrollRuns(accessToken).then((page) => setLatestRun(page.data[0] ?? null)).catch(() => undefined)
  }, [accessToken, isHr])

  const tiles: Tile[] = [
    ...(headcount ? [{ label: isHr ? 'Headcount' : 'Team headcount', value: String(headcount.headcount), to: '/reports' }] : []),
    ...(headcount && isHr ? [{ label: 'Onboarding', value: String(headcount.onboarding), to: '/reports' }] : []),
    ...(joiners !== null ? [{ label: 'Joiners this month', value: String(joiners), to: '/reports' }] : []),
    ...(isHr && latestRun !== undefined ? [latestRun
      ? { label: 'Latest payroll', value: `${latestRun.month.slice(0, 7)} ${latestRun.status}`, to: `/payroll/${latestRun.id}` }
      : { label: 'Latest payroll', value: 'No payroll runs yet', to: '/payroll' }] : []),
  ]

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile) => (
        <Link key={tile.label} to={tile.to} className="border rounded p-3 hover:bg-muted">
          <span className="block text-xs text-muted-foreground">{tile.label}</span>{' '}
          <span className="block text-lg font-semibold">{tile.value}</span>
        </Link>
      ))}
    </div>
  )
}
