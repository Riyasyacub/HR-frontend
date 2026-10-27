import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { getLeaveBalances } from '../api/leaves'
import LeaveBalances from './LeaveBalances'

vi.mock('../api/leaves', () => ({ getLeaveBalances: vi.fn() }))

describe('LeaveBalances', () => {
  it('shows remaining of entitled days per leave type', async () => {
    vi.mocked(getLeaveBalances).mockResolvedValue([
      { leave_type: 'Earned', entitled: 6, used: 1, remaining: 5 },
      { leave_type: 'Sick', entitled: 6, used: 0, remaining: 6 },
    ])

    render(<LeaveBalances accessToken="token" employeeId={3} />)

    expect(await screen.findByText('Earned: 5 of 6 days left')).toBeInTheDocument()
    expect(screen.getByText('Sick: 6 of 6 days left')).toBeInTheDocument()
    expect(getLeaveBalances).toHaveBeenCalledWith('token', 3)
  })

  it('shows an error when balances fail to load', async () => {
    vi.mocked(getLeaveBalances).mockRejectedValue(new Error('boom'))

    render(<LeaveBalances accessToken="token" employeeId={3} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load leave balances.')
  })
})
