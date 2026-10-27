import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Pager from './Pager'

describe('Pager', () => {
  it('disables Previous on the first page and reports the next page', async () => {
    const onPage = vi.fn()
    render(<Pager page={1} pageCount={3} onPage={onPage} />)

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(onPage).toHaveBeenCalledWith(2)
  })

  it('disables Next on the last page', () => {
    render(<Pager page={3} pageCount={3} onPage={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})
