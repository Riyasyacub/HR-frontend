import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import QuickActions from './QuickActions'

function links(props: Parameters<typeof QuickActions>[0]) {
  render(<MemoryRouter><QuickActions {...props} /></MemoryRouter>)
  return screen.getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])
}

describe('QuickActions', () => {
  it('gives HR import, leave, payroll and reports actions', () => {
    expect(links({ isHr: true, isManager: false, employeeId: null })).toEqual([
      ['Import employees', '/employee-import'], ['Upload leave', '/leave-upload'], ['Create payroll run', '/payroll'], ['View reports', '/reports'],
    ])
  })

  it('gives a manager org chart, team and reports actions', () => {
    expect(links({ isHr: false, isManager: true, employeeId: 7 })).toEqual([
      ['Open org chart', '/org-chart'], ['View my team', '/team'], ['View reports', '/reports'],
    ])
  })

  it('gives an employee their leave and profile', () => {
    expect(links({ isHr: false, isManager: false, employeeId: 7 })).toEqual([['View my leave', '/leave-records'], ['My profile', '/employees/7']])
  })
})
