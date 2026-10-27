import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useUnsavedChanges } from '@/shared/hooks/common/use-unsaved-changes'

function Harness({
  onDiscard = () => undefined,
  onSave,
}: {
  onDiscard?: () => void
  onSave?: () => Promise<boolean | void> | boolean | void
}) {
  const { dialogProps } = useUnsavedChanges({ isDirty: true, onDiscard, onSave })

  return (
    <div>
      <a href="/other-page">Leave form</a>
      <output aria-label="Dialog open">{String(dialogProps.isOpen)}</output>
      <button type="button" onClick={dialogProps.onLeave}>
        Leave without saving
      </button>
      <button type="button" onClick={() => void dialogProps.onSaveAndLeave()}>
        Save and leave
      </button>
    </div>
  )
}

function PersistentHarness() {
  const [isDirty, setIsDirty] = useState(true)
  const { dialogProps } = useUnsavedChanges({
    isDirty,
    onDiscard: () => setIsDirty(false),
  })

  return (
    <div>
      <a href="/other-page">Leave persistent form</a>
      <output aria-label="Persistent dialog open">{String(dialogProps.isOpen)}</output>
      <button type="button" onClick={dialogProps.onLeave}>Discard persistent changes</button>
      <button type="button" onClick={() => setIsDirty(true)}>Edit again</button>
    </div>
  )
}

describe('useUnsavedChanges', () => {
  it('lets replayed navigation through after leaving without saving', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('link', { name: 'Leave form' }))
    expect(screen.getByRole('status', { name: 'Dialog open' })).toHaveTextContent('true')

    fireEvent.click(screen.getByRole('button', { name: 'Leave without saving' }))

    expect(screen.getByRole('status', { name: 'Dialog open' })).toHaveTextContent('false')
  })

  it('keeps the dirty-form guard bypassed after the user chooses to discard changes', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('link', { name: 'Leave form' }))
    fireEvent.click(screen.getByRole('button', { name: 'Leave without saving' }))
    fireEvent.click(screen.getByRole('link', { name: 'Leave form' }))

    expect(screen.getByRole('status', { name: 'Dialog open' })).toHaveTextContent('false')
  })

  it('discards the edited form values before leaving', () => {
    const onDiscard = vi.fn()
    render(<Harness onDiscard={onDiscard} />)

    fireEvent.click(screen.getByRole('link', { name: 'Leave form' }))
    fireEvent.click(screen.getByRole('button', { name: 'Leave without saving' }))

    expect(onDiscard).toHaveBeenCalledOnce()
  })

  it('submits the current form before leaving when Save and leave is chosen', async () => {
    const onSave = vi.fn().mockResolvedValue(true)
    render(<Harness onSave={onSave} />)

    fireEvent.click(screen.getByRole('link', { name: 'Leave form' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save and leave' }))

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce())
  })

  it('re-arms a persistent guard when the form becomes dirty again after discard', () => {
    render(<PersistentHarness />)

    fireEvent.click(screen.getByRole('link', { name: 'Leave persistent form' }))
    fireEvent.click(screen.getByRole('button', { name: 'Discard persistent changes' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit again' }))
    fireEvent.click(screen.getByRole('link', { name: 'Leave persistent form' }))

    expect(screen.getByRole('status', { name: 'Persistent dialog open' })).toHaveTextContent('true')
  })
})
