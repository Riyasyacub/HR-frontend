import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listLeaveRecords } from '../api/leaves'
import LeaveHistory from './LeaveHistory'

vi.mock('../api/leaves', () => ({ listLeaveRecords: vi.fn() }))

describe('LeaveHistory', () => {
  beforeEach(() => vi.clearAllMocks())

  it("lists the employee's leave with type, reason and unpaid flag", async () => {
    vi.mocked(listLeaveRecords).mockResolvedValue({
      data: [
        { id: 2, leave_date: '2026-10-29', leave_type: 'Unpaid', reason: null, payroll_deduction: true, employee: { id: 3, employee_id: 'EMP102', name: 'Priya Sharma' } },
        { id: 1, leave_date: '2026-10-28', leave_type: 'Earned', reason: 'Family function', payroll_deduction: false, employee: { id: 3, employee_id: 'EMP102', name: 'Priya Sharma' } },
      ],
      meta: { page: 1, per_page: 100, total: 2 },
    })

    render(<LeaveHistory accessToken="token" employeeId={3} />)

    const items = await screen.findAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      '2026-10-29 · Unpaid · Payroll deduction',
      '2026-10-28 · Earned · Family function',
    ])
    expect(listLeaveRecords).toHaveBeenCalledWith('token', '', 3)
  })

  it('shows an empty state when no leave was taken', async () => {
    vi.mocked(listLeaveRecords).mockResolvedValue({ data: [], meta: { page: 1, per_page: 100, total: 0 } })

    render(<LeaveHistory accessToken="token" employeeId={3} />)

    expect(await screen.findByText('No leave taken.')).toBeInTheDocument()
  })
})
