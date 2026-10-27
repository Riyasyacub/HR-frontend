import { asyncDataLoaderFeature, hotkeysCoreFeature } from '@headless-tree/core'
import { useTree } from '@headless-tree/react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getOrgChart, getOrgChartPath, type OrgNode } from '../api/orgChart'
import { useAuth } from '../auth/AuthContext'
import OrgSearch from '../components/OrgSearch'
import { Button } from '../components/ui/button'
import { Tree, TreeItem, TreeItemLabel } from '../components/reui/tree'
import { Avatar, AvatarFallback } from '../components/ui/avatar'

const ROOT = 'root'
const INDENT = 24
const initials = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2)

type OrgTreeProps = { token: string; rootId: string | null; focusId: string | null; onError: (message: string) => void }

function OrgTree({ token, rootId, focusId, onError }: OrgTreeProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const tree = useTree<OrgNode | null>({
    rootItemId: ROOT,
    indent: INDENT,
    state: { expandedItems },
    setExpandedItems,
    getItemName: (item) => item.getItemData()?.name ?? '',
    isItemFolder: (item) => item.getId() === ROOT || (item.getItemData()?.reports_count ?? 0) > 0,
    createLoadingItemData: () => null,
    dataLoader: {
      getItem: async () => null,
      getChildrenWithData: async (id) => {
        const load = id !== ROOT ? getOrgChart(token, Number(id)) : rootId ? getOrgChartPath(token, Number(rootId)).then((chain) => chain.slice(-1)) : getOrgChart(token, undefined)
        const reports = await load.catch(() => {
          onError('Could not load the org chart.')
          return []
        })
        return reports.map((employee) => ({ id: String(employee.id), data: employee }))
      },
    },
    features: [asyncDataLoaderFeature, hotkeysCoreFeature],
  })

  useEffect(() => {
    if (!focusId) return
    getOrgChartPath(token, Number(focusId))
      .then((chain) => setExpandedItems((current) => [...new Set([...current, ...chain.filter((e) => e.reports_count > 0).map((e) => String(e.id))])]))
      .catch(() => onError('Could not find that employee in your org chart.'))
  }, [token, focusId, onError])

  useEffect(() => {
    document.querySelector(`[data-employee="${focusId}"]`)?.scrollIntoView?.({ block: 'center' })
  })

  return (
    <Tree indent={INDENT} tree={tree} className="rounded border p-2">
      {tree.getItems().map((item) => {
        const employee = item.getItemData()
        if (!employee) return null
        const focused = String(employee.id) === focusId
        return (
          <TreeItem key={item.getId()} item={item} asChild>
            <div data-employee={employee.id} aria-current={focused || undefined}>
              <TreeItemLabel className={`gap-2 py-1 ${focused ? 'ring-2 ring-primary rounded' : ''}`}>
                <Avatar className="size-6 shrink-0"><AvatarFallback className="text-[9px]">{initials(employee.name)}</AvatarFallback></Avatar>
                <span className="flex flex-col items-start">
                  <Link to={`/employees/${employee.id}`} onClick={(event) => event.stopPropagation()} className="text-sm leading-tight underline">{employee.name}</Link>
                  <span className="text-muted-foreground text-[10px] leading-tight">{employee.employee_id} · {employee.job_title} · {employee.department}</span>
                </span>
              </TreeItemLabel>
            </div>
          </TreeItem>
        )
      })}
    </Tree>
  )
}

export default function OrgChartPage() {
  const { session } = useAuth()
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const focusId = searchParams.get('focus')
  const rootId = searchParams.get('root')
  if (!session) return null

  return (
    <main className="p-6 space-y-3 max-w-3xl">
      <h1 className="text-2xl font-semibold">Org chart</h1>
      <OrgSearch accessToken={session.access_token} onSelect={(id) => setSearchParams({ focus: String(id) })} />
      {rootId && <Button variant="outline" onClick={() => setSearchParams({ focus: rootId })}>Show full tree</Button>}
      {!rootId && focusId && <Button variant="outline" onClick={() => setSearchParams({ root: focusId })}>Show only this subtree</Button>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <OrgTree key={rootId ?? 'all'} token={session.access_token} rootId={rootId} focusId={focusId} onError={setError} />
    </main>
  )
}
