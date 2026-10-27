import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it, vi } from 'vitest'

import messages from '@/messages/en.json'
import { UnsavedChangesDialog } from '@/shared/components/common/unsaved-changes-dialog'

describe('UnsavedChangesDialog', () => {
  it('orders the actions from least to most committal and uses the requested variants', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <UnsavedChangesDialog
          isOpen
          isSaving={false}
          hasSaveAction
          onLeave={vi.fn()}
          onSaveAndLeave={vi.fn()}
          onStay={vi.fn()}
        />
      </NextIntlClientProvider>,
    )

    const buttons = screen.getAllByRole('button')

    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveAccessibleName('Leave without saving')
    expect(buttons[0]).toHaveAttribute('data-variant', 'outline-primary')
    expect(buttons[1]).toHaveAccessibleName('Stay on page')
    expect(buttons[1]).toHaveAttribute('data-variant', 'outline-primary')
    expect(buttons[2]).toHaveAccessibleName('Save & Leave')
    expect(buttons[2]).toHaveAttribute('data-variant', 'default')
  })
})
