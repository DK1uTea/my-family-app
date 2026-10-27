import type { SVGProps } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { LazyDropdown } from '@/shared/components/ui/lazy-dropdown'

function CustomIcon(props: SVGProps<SVGSVGElement>) {
  return <svg data-testid="custom-icon" {...props} />
}

type Item = { id: string; name: string }

const defaultProps = {
  label: 'Roles',
  open: false,
  onOpenChange: vi.fn(),
  items: [] as Item[],
  selectedId: null,
  onSelect: vi.fn(),
  allLabel: 'All roles',
  getItemId: (item: Item) => item.id,
  getItemLabel: (item: Item) => item.name,
}

describe('LazyDropdown', () => {
  it('shows ListFilter by default before the label', () => {
    render(<LazyDropdown {...defaultProps} />)

    const trigger = screen.getByRole('button', { name: 'Roles' })
    const icon = trigger.querySelector('[data-slot="lazy-dropdown-icon"]')
    const label = screen.getByText('Roles')

    expect(icon).toBeInTheDocument()
    expect(icon!.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('renders a custom icon', () => {
    render(<LazyDropdown {...defaultProps} icon={CustomIcon} />)

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('hides the icon when showIcon is false', () => {
    render(<LazyDropdown {...defaultProps} icon={CustomIcon} showIcon={false} />)

    expect(screen.queryByTestId('custom-icon')).not.toBeInTheDocument()
  })

  it('places the icon after the label when iconPosition is end', () => {
    render(<LazyDropdown {...defaultProps} icon={CustomIcon} iconPosition="end" />)

    const label = screen.getByText('Roles')
    const icon = screen.getByTestId('custom-icon')

    expect(label.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
