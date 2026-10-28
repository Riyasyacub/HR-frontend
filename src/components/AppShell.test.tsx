import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import AppShell from './AppShell'

vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const signOut = vi.fn().mockResolvedValue(undefined)

function renderShell(user: Partial<User>, path = '/dashboard') {
  vi.mocked(useAuth).mockReturnValue({
    session: { access_token: 'token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'Priya Sharma', email: 'p@demo.test', role: 'standard_employee', country: 'India', ...user } },
    status: 'authenticated', signIn: vi.fn(), signOut,
  })
  render(<MemoryRouter initialEntries={[path]}><AppShell><p>page content</p></AppShell></MemoryRouter>)
  return within(screen.getByRole('navigation', { name: 'Main' }))
}

const linkNames = (nav: ReturnType<typeof renderShell>) => nav.getAllByRole('link').map((link) => link.textContent)

describe('AppShell', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows HR every section', () => {
    const nav = renderShell({ role: 'HR' })

    expect(linkNames(nav)).toEqual(['Dashboard', 'Employees', 'Org chart', 'Leave records', 'Leave upload', 'Payroll runs', 'Employee import', 'Reports', 'Assistant', 'Settings'])
    expect(screen.getByText('page content')).toBeInTheDocument()
  })

  it('shows a manager their team tools without HR sections', () => {
    expect(linkNames(renderShell({ is_manager: true }))).toEqual(['Dashboard', 'Org chart', 'My team', 'Leave records', 'Reports', 'Assistant'])
  })

  it('shows an employee only their own sections', () => {
    expect(linkNames(renderShell({}))).toEqual(['Dashboard', 'Leave records', 'Assistant'])
  })

  it('marks the current page active', () => {
    const nav = renderShell({ role: 'HR' }, '/payroll')

    expect(nav.getByRole('link', { name: 'Payroll runs' })).toHaveAttribute('data-active', 'true')
    expect(nav.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('data-active', 'true')
  })

  it('signs out from the sidebar footer', async () => {
    renderShell({})

    expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(signOut).toHaveBeenCalled()
  })
})
