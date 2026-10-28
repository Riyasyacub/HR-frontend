import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarInset,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from './ui/sidebar'

type Access = 'all' | 'hr' | 'manager' | 'hrOrManager'
const SECTIONS: { label: string; links: { to: string; label: string; access: Access }[] }[] = [
  { label: 'People', links: [{ to: '/dashboard', label: 'Dashboard', access: 'all' }, { to: '/employees', label: 'Employees', access: 'hr' },
    { to: '/org-chart', label: 'Org chart', access: 'hrOrManager' }, { to: '/team', label: 'My team', access: 'manager' }] },
  { label: 'Leave', links: [{ to: '/leave-records', label: 'Leave records', access: 'all' }, { to: '/leave-upload', label: 'Leave upload', access: 'hr' }] },
  { label: 'Payroll', links: [{ to: '/payroll', label: 'Payroll runs', access: 'hr' }] },
  { label: 'Data', links: [{ to: '/employee-import', label: 'Employee import', access: 'hr' }] },
  { label: 'Insights', links: [{ to: '/reports', label: 'Reports', access: 'hrOrManager' }] },
  { label: 'Admin', links: [{ to: '/settings', label: 'Settings', access: 'hr' }] },
]

export default function AppShell({ children }: { children: ReactNode }) {
  const { session, signOut } = useAuth()
  const { pathname } = useLocation()
  const isHr = session?.user.role === 'HR'
  const isManager = Boolean(session?.user.is_manager)
  const allowed = { all: true, hr: isHr, manager: isManager, hrOrManager: isHr || isManager }
  const sections = SECTIONS.map((section) => ({ ...section, links: section.links.filter((link) => allowed[link.access]) })).filter((section) => section.links.length)
  const name = session?.user.name ?? ''

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-4 py-3 text-lg font-semibold text-sidebar-primary">◆ Incubyte HR</SidebarHeader>
        <SidebarContent>
          <nav aria-label="Main">
            {sections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
                <SidebarMenu>
                  {section.links.map((link) => (
                    <SidebarMenuItem key={link.to}>
                      <SidebarMenuButton asChild isActive={pathname === link.to || pathname.startsWith(`${link.to}/`)}>
                        <Link to={link.to}>{link.label}</Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </nav>
        </SidebarContent>
        <SidebarFooter className="flex-row items-center gap-2 border-t p-3">
          <Avatar className="size-8"><AvatarFallback>{name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
          <span className="flex-1 truncate text-sm">{name}</span>
          <Button variant="ghost" size="sm" onClick={() => void signOut().catch(() => undefined)}>Sign out</Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b bg-background px-4"><SidebarTrigger /></header>
        <div className="flex-1">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
