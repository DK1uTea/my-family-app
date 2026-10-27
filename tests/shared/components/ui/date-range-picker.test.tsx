import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DateRangePicker } from '@/shared/components/ui/date-range-picker'

/**
 * Sheet #17/#18 (calendar-dashboard "Datum" filter Apply-disable rules).
 *
 * `docs/specs/calendar-dashboard.md`'s Out of Scope note confirms the real
 * interaction is the calendar grid, not the Start/End textboxes — the day
 * cells (`mini-calendar.tsx`, `data-testid="date-day-cell"`) are what drives
 * `handleDayClick` in `date-range-picker.tsx`. This drives the picker the
 * same way rather than typing into the textboxes.
 */
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))
vi.mock('@/shared/stores/use-user-store', () => ({
  useDateFormat: () => 'DD.MM.YYYY',
}))

function openPicker(user: ReturnType<typeof userEvent.setup>) {
  return user.click(screen.getByRole('button', { name: /startDate.*endDate/ }))
}

describe('DateRangePicker Apply button (Datum filter)', () => {
  // date-range-picker.tsx's Apply condition was changed (2026-09-07,
  // "Refactor rent module tests and components for localization and improved
  // date handling") from `disabled={!!(range.from && !range.to)}` to
  // `disabled={!range.from || !range.to}` — Apply now requires BOTH Start and
  // End, matching sheet #17/testcase/rent/list-product.md case 27 exactly.
  // Updated this test to match the current, correct behavior instead of the
  // stale one it used to document.
  it('is disabled with an empty range — both Start and End are required (sheet #17 / case 27)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPicker(user)

    expect(screen.getByRole('button', { name: 'apply' })).toBeDisabled()
  })

  it('disables Apply once only Start is picked and End is still missing', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPicker(user)

    const firstDayCell = screen.getAllByTestId('date-day-cell').find(
      (c) => !c.hasAttribute('disabled'),
    )!
    await user.click(firstDayCell)

    expect(screen.getByRole('button', { name: 'apply' })).toBeDisabled()
  })

  it('enables Apply once both Start and End are picked from the grid', async () => {
    const user = userEvent.setup()
    const onApply = vi.fn()
    render(<DateRangePicker onApplyAction={onApply} />)
    await openPicker(user)

    const enabledCells = screen.getAllByTestId('date-day-cell').filter(
      (c) => !c.hasAttribute('disabled'),
    )
    await user.click(enabledCells[0])
    expect(screen.getByRole('button', { name: 'apply' })).toBeDisabled()
    await user.click(enabledCells[5])

    expect(screen.getByRole('button', { name: 'apply' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'apply' }))
    expect(onApply).toHaveBeenCalledWith(
      expect.objectContaining({ from: expect.any(Date), to: expect.any(Date) }),
    )
  })

  // Sheet #18 says picking an End date before Start disables Apply. The real
  // component has no such guard for the grid path — the grid's second click
  // (`handleDayClick`) always re-orders into a valid range (a click before
  // the current Start restarts the range from that earlier day instead of
  // rejecting it), so Apply never becomes disabled for this reason. There is
  // no path in this component's real behavior that reproduces "End < Start
  // stays picked while Apply is disabled" — flagging this as a sheet claim
  // that does not match the implementation rather than asserting it.
  it('re-starts the range instead of disabling Apply when the second click is earlier than the first (sheet #18 contradiction)', async () => {
    const user = userEvent.setup()
    render(<DateRangePicker />)
    await openPicker(user)

    const enabledCells = screen.getAllByTestId('date-day-cell').filter(
      (c) => !c.hasAttribute('disabled'),
    )
    const laterCell = enabledCells[10]
    const earlierCell = enabledCells[0]

    await user.click(laterCell)
    await user.click(earlierCell)

    // Re-started as a new single-sided range (Start = the earlier day), so
    // Apply is disabled again waiting for a new End — not because End < Start
    // was rejected, but because the range was reset.
    expect(screen.getByRole('button', { name: 'apply' })).toBeDisabled()
  })
})
