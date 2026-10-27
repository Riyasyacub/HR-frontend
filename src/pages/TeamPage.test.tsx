import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getTeam } from '../api/employees'
import { useAuth } from '../auth/AuthContext'
import TeamPage from './TeamPage'

vi.mock('../api/employees', () => ({
  getTeam: vi.fn(),
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: vi.fn(),
}))

function renderTeam() {
  return render(
    <MemoryRouter initialEntries={['/team']}>
      <Routes>
        <Route path="/team" element={<TeamPage />} />
        <Route path="/employees/:id" element={<p>Employee profile</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('TeamPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      session: {
        access_token: 'manager-token',
        token_type: 'Bearer',
        expires_in: 900,
        user: {
          id: 3,
          name: 'Arjun Rao',
          email: 'arjun@demo.test',
          role: 'standard_employee',
          country: 'India',
          is_manager: true,
        },
      },
      status: 'authenticated',
      signIn: vi.fn(),
      signOut: vi.fn(),
    })
  })

  it('lists the manager subtree with links to profiles', async () => {
    vi.mocked(getTeam).mockResolvedValue([
      {
        id: 10,
        employee_id: 'EMP102',
        first_name: 'Priya',
        last_name: 'Sharma',
        work_email: 'priya@demo.test',
        country: 'India',
        currency: 'INR',
        job_title: 'Product Manager',
        start_date: '2026-01-01',
        status: 'active',
        department: { id: 1, name: 'Product' },
      },
      {
        id: 11,
        employee_id: 'EMP104',
        first_name: 'Kavita',
        last_name: 'Rao',
        work_email: 'kavita@demo.test',
        country: 'India',
        currency: 'INR',
        job_title: 'Engineer',
        start_date: '2026-02-01',
        status: 'active',
        department: { id: 2, name: 'Engineering' },
      },
    ])

    renderTeam()

    expect(await screen.findByRole('heading', { name: 'My team' })).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Priya Sharma (EMP102)' }),
    ).toHaveAttribute('href', '/employees/10')
    expect(screen.getByText('Product Manager')).toBeInTheDocument()
    expect(screen.getByText('Product')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Kavita Rao (EMP104)' }),
    ).toHaveAttribute('href', '/employees/11')
    expect(getTeam).toHaveBeenCalledWith('manager-token')
  })

  it('shows an empty state when the manager has no team members', async () => {
    vi.mocked(getTeam).mockResolvedValue([])

    renderTeam()

    expect(
      await screen.findByText('You do not have any team members yet.'),
    ).toBeInTheDocument()
  })

  it('shows an error when the team cannot be loaded', async () => {
    vi.mocked(getTeam).mockRejectedValue(
      new Error('You are not authorized to perform this action.'),
    )

    renderTeam()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You are not authorized to perform this action.',
    )
  })
})
