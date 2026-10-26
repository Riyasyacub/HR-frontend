import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import CompensationInputs from './CompensationInputs'

describe('CompensationInputs', () => {
  it('displays country currency and derives annual CTC from components', async () => {
    const onChange = vi.fn()
    const components = [
      { name: 'Basic', annual_amount: '1000000.50' },
      { name: 'Allowance', annual_amount: '199999.50' },
    ]

    render(
      <CompensationInputs
        currency="INR"
        components={components}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('1,200,000.00 INR')).toBeInTheDocument()
    expect(screen.queryByLabelText('Currency')).not.toBeInTheDocument()
  })

  it('allows adding and updating compensation components', async () => {
    const onChange = vi.fn()
    const components = [{ name: 'Basic', annual_amount: '50000' }]

    render(
      <CompensationInputs
        currency="CAD"
        components={components}
        onChange={onChange}
      />,
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Add component' }))

    expect(onChange).toHaveBeenCalledWith([
      { name: 'Basic', annual_amount: '50000' },
      { name: '', annual_amount: '' },
    ])
  })
})
