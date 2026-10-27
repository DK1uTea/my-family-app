import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'

import messages from '@/messages/en.json'
import { Pagination } from '@/shared/components/ui/pagination'

function renderPagination(props: Partial<React.ComponentProps<typeof Pagination>> = {}) {
  const onPageChange = vi.fn()

  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <Pagination
        currentPage={34}
        totalPages={68}
        onPageChange={onPageChange}
        {...props}
      />
    </NextIntlClientProvider>,
  )

  return { onPageChange }
}

describe('Pagination', () => {
  it('renders numbered pagination by default with all navigation controls', () => {
    renderPagination()

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'First page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Last page' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Page 34, current page' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('requests the first, previous, selected, next, and last pages', async () => {
    const user = userEvent.setup()
    const { onPageChange } = renderPagination()

    await user.click(screen.getByRole('button', { name: 'First page' }))
    await user.click(screen.getByRole('button', { name: 'Previous page' }))
    await user.click(screen.getByRole('button', { name: 'Go to page 35' }))
    await user.click(screen.getByRole('button', { name: 'Next page' }))
    await user.click(screen.getByRole('button', { name: 'Last page' }))

    expect(onPageChange.mock.calls).toEqual([[1], [33], [35], [35], [68]])
  })

  it('disables backward navigation on the first page', () => {
    renderPagination({ currentPage: 1 })

    expect(screen.getByRole('button', { name: 'First page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Last page' })).toBeEnabled()
  })

  it('disables forward navigation on the last page', () => {
    renderPagination({ currentPage: 68 })

    expect(screen.getByRole('button', { name: 'First page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Last page' })).toBeDisabled()
  })

  it('renders the compact presentation when requested', () => {
    renderPagination({ currentPage: 2, variant: 'compact' })

    expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument()
    expect(screen.getByLabelText('Page 2, current page')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('of 68')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'First page' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Last page' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go to page 1' })).not.toBeInTheDocument()
  })

  it('disables every page control while navigation is pending', () => {
    renderPagination({ disabled: true })

    expect(screen.getAllByRole('button').every((button) => button.hasAttribute('disabled'))).toBe(true)
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
  })

  it('does not render when there is one page', () => {
    renderPagination({ currentPage: 1, totalPages: 1 })

    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
  })
})
