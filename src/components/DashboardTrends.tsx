import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { getTrends, type Trends } from '../api/reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart'

// Fixed categorical order validated for colour-blind separation; colour follows the leave type, never its rank.
const LEAVE_COLORS: Record<string, string> = { Earned: '#2a78d6', Sick: '#eb6834', Casual: '#1baf7a', Unpaid: '#eda100' }
const axes = [<CartesianGrid key="grid" vertical={false} />, <XAxis key="x" dataKey="month" tickLine={false} axisLine={false} />,
  <YAxis key="y" width={56} tickLine={false} axisLine={false} />, <ChartTooltip key="tip" content={<ChartTooltipContent />} />]

function TrendCard({ title, description, config, children }: { title: string; description?: string; config: ChartConfig; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle>{description && <CardDescription>{description}</CardDescription>}</CardHeader>
      <CardContent><ChartContainer config={config} className="h-48 w-full">{children}</ChartContainer></CardContent>
    </Card>
  )
}

export default function DashboardTrends({ accessToken, isHr }: { accessToken: string; isHr: boolean }) {
  const [trends, setTrends] = useState<Trends | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getTrends(accessToken).then(setTrends).catch(() => setError('Could not load the trends.'))
  }, [accessToken])

  if (error) return <p role="alert" className="mt-8 text-sm text-destructive">{error}</p>
  if (!trends) return null
  const rows = trends.months.map((month, index) => ({ month, headcount: trends.headcount[index], joiners: trends.joiners[index],
    ...Object.fromEntries(trends.leave_days.map((series) => [series.leave_type, series.values[index]])) }))
  const leaveConfig = Object.fromEntries(trends.leave_days.map(({ leave_type }) => [leave_type, { label: leave_type, color: LEAVE_COLORS[leave_type] ?? 'var(--muted-foreground)' }]))

  return (
    <section className="mt-8 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Trends (last 12 months)</h2>
        <Link to="/reports" className="text-sm text-primary">View in Reports</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendCard title="Headcount trend" description={`Latest: ${trends.headcount.at(-1)?.toLocaleString('en-US') ?? 0}`} config={{ headcount: { label: 'Headcount', color: 'var(--primary)' } }}>
          <LineChart data={rows}>{axes}<Line dataKey="headcount" stroke="var(--color-headcount)" strokeWidth={2} dot={false} /></LineChart>
        </TrendCard>
        <TrendCard title="Joiners per month" config={{ joiners: { label: 'Joiners', color: 'var(--primary)' } }}>
          <BarChart data={rows}>{axes}<Bar dataKey="joiners" fill="var(--color-joiners)" radius={[4, 4, 0, 0]} /></BarChart>
        </TrendCard>
        <Card>
          <CardHeader><CardTitle>Leave days by type</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <ChartContainer config={leaveConfig} className="h-48 w-full">
              <BarChart data={rows}>{axes}{trends.leave_days.map(({ leave_type }) => <Bar key={leave_type} dataKey={leave_type} stackId="leave" fill={`var(--color-${leave_type})`} stroke="var(--card)" strokeWidth={2} />)}</BarChart>
            </ChartContainer>
            <ul aria-label="Leave types" className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {trends.leave_days.map(({ leave_type }) => <li key={leave_type} className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: leaveConfig[leave_type].color }} />{leave_type}</li>)}
            </ul>
          </CardContent>
        </Card>
        {isHr && trends.payroll_totals?.map(({ currency, values }) => (
          <TrendCard key={currency} title={`Payroll total (${currency})`} config={{ total: { label: currency, color: 'var(--primary)' } }}>
            <LineChart data={trends.months.map((month, index) => ({ month, total: Number(values[index]) }))}>{axes}<Line dataKey="total" stroke="var(--color-total)" strokeWidth={2} dot={false} /></LineChart>
          </TrendCard>
        ))}
      </div>
    </section>
  )
}
