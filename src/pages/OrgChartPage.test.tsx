import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listEmployees } from '../api/employees'
import { getOrgChart, getOrgChartPath } from '../api/orgChart'
import { useAuth } from '../auth/AuthContext'
import OrgChartPage from './OrgChartPage'

vi.mock('../api/orgChart', () => ({ getOrgChart: vi.fn(), getOrgChartPath: vi.fn() }))
vi.mock('../api/employees', () => ({ listEmployees: vi.fn() }))
vi.mock('../auth/AuthContext', () => ({ useAuth: vi.fn() }))

const card = (id: number, name: string, reports_count = 0) => ({ id, employee_id: `EMP${id}`, name, job_title: 'Role', department: 'Eng', reports_count })
const meera = card(103, 'Meera Nair', 1)
const arjun = card(102, 'Arjun Rao', 1)
const priya = card(101, 'Priya Sharma', 1)
const reportsOf: Record<number, ReturnType<typeof card>[]> = { 103: [arjun], 102: [priya], 101: [card(99, 'Intern One')] }

function renderPage(entry = '/org-chart') {
  render(<MemoryRouter initialEntries={[entry]}><OrgChartPage /></MemoryRouter>)
}

describe('OrgChartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'hr-token', token_type: 'Bearer', expires_in: 900, user: { id: 1, name: 'HR Admin', email: 'hr@demo.test', role: 'HR', country: 'India' } },
      status: 'authenticated', signIn: vi.fn(), signOut: vi.fn(),
    })
    vi.mocked(getOrgChart).mockImplementation(async (_token, managerId) => (managerId ? reportsOf[managerId] ?? [] : [meera, card(104, 'Robert Miller')]))
    vi.mocked(getOrgChartPath).mockResolvedValue([meera, arjun, priya])
  })

  it('loads the top-level employees as tree items linked to their profiles', async () => {
    renderPage()

    expect(await screen.findByRole('link', { name: 'Meera Nair' })).toHaveAttribute('href', '/employees/103')
    expect(screen.getByRole('link', { name: 'Robert Miller' })).toBeInTheDocument()
    expect(screen.getByText('EMP103 · Role · Eng')).toBeInTheDocument()
    expect(screen.getAllByRole('treeitem')).toHaveLength(2)
    expect(getOrgChart).toHaveBeenCalledWith('hr-token', undefined)
  })

  it('loads reports when an employee is expanded and hides them when collapsed', async () => {
    renderPage()
    const meeraItem = (await screen.findByRole('link', { name: 'Meera Nair' })).closest('[role="treeitem"]') as HTMLElement

    await userEvent.click(meeraItem)
    expect(await screen.findByRole('link', { name: 'Arjun Rao' })).toBeInTheDocument()
    expect(getOrgChart).toHaveBeenCalledWith('hr-token', 103)

    await userEvent.click(meeraItem)
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Arjun Rao' })).not.toBeInTheDocument())
  })

  it('shows an error when the chart cannot be loaded', async () => {
    vi.mocked(getOrgChart).mockRejectedValue(new Error('boom'))

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the org chart.')
  })

  it('focuses an employee from the URL: expands the chain and marks them current', async () => {
    renderPage('/org-chart?focus=101')

    const priyaLink = await screen.findByRole('link', { name: 'Priya Sharma' })
    expect(priyaLink.closest('[aria-current]')).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('link', { name: 'Arjun Rao' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Intern One' })).toBeInTheDocument()
    expect(getOrgChartPath).toHaveBeenCalledWith('hr-token', 101)
  })

  it('searches by name or ID and focuses the chosen employee', async () => {
    vi.mocked(listEmployees).mockResolvedValue({ data: [{ id: 101, employee_id: 'EMP101', first_name: 'Priya', last_name: 'Sharma' }], meta: { page: 1, per_page: 10, total: 1 } } as never)
    renderPage()

    await userEvent.type(screen.getByLabelText('Find employee'), 'EMP101')
    await userEvent.click(screen.getByRole('button', { name: 'Find' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Priya Sharma (EMP101)' }))

    expect(listEmployees).toHaveBeenCalledWith('hr-token', 1, 10, 'search=EMP101')
    expect(await screen.findByRole('link', { name: 'Priya Sharma' })).toBeInTheDocument()
    expect(getOrgChartPath).toHaveBeenCalledWith('hr-token', 101)
  })

  it('shows only a subtree from ?root and returns to the full tree', async () => {
    vi.mocked(getOrgChartPath).mockResolvedValue([meera, arjun])
    renderPage('/org-chart?root=102')

    const arjunLink = await screen.findByRole('link', { name: 'Arjun Rao' })
    expect(screen.getAllByRole('treeitem')).toHaveLength(1)
    await userEvent.click(arjunLink.closest('[role="treeitem"]') as HTMLElement)
    expect(await screen.findByRole('link', { name: 'Priya Sharma' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show full tree' }))
    expect(await screen.findByRole('link', { name: 'Meera Nair' })).toBeInTheDocument()
    expect(getOrgChart).toHaveBeenCalledWith('hr-token', undefined)
  })

  it('switches a focused employee to subtree mode', async () => {
    renderPage('/org-chart?focus=101')

    await userEvent.click(await screen.findByRole('button', { name: 'Show only this subtree' }))

    await waitFor(() => expect(screen.queryByRole('link', { name: 'Meera Nair' })).not.toBeInTheDocument())
    expect(await screen.findByRole('link', { name: 'Priya Sharma' })).toBeInTheDocument()
  })
})
