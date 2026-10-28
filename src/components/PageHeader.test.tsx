import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PageHeader from './PageHeader'
import StatusBadge from './StatusBadge'

describe('PageHeader', () => {
  it('renders the title, description and actions', () => {
    render(<PageHeader title="Employees" description="Everyone in the company" actions={<button>Add employee</button>} />)

    expect(screen.getByRole('heading', { level: 1, name: 'Employees' })).toBeInTheDocument()
    expect(screen.getByText('Everyone in the company')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add employee' })).toBeInTheDocument()
  })
})

describe('StatusBadge', () => {
  it.each([
    ['active', 'success'], ['paid', 'success'], ['completed', 'success'], ['queued', 'warning'], ['draft', 'warning'],
    ['failed', 'danger'], ['generated', 'info'], ['onboarding', 'neutral'], ['unknown', 'neutral'],
  ])('shows %s with the %s tone', (status, tone) => {
    render(<StatusBadge status={status} />)

    expect(screen.getByText(status)).toHaveAttribute('data-tone', tone)
  })
})
