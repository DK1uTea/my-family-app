import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import DashboardMain from '@/features/dashboard/(components)/dashboard-main'
import { PERMISSIONS } from '@/shared/constants/permissions'
import { useUserStore } from '@/shared/stores/use-user-store'
import viMessages from '@/messages/vi.json'

/**
 * Test-case source: Dashboard test case sheet — "Role-based Visibility" section, plus
 * the greeting bullets under "Layout / UI tổng quan".
 *
 * `ComponentGuard` uses OR logic across `requiredKeys` (`useHasPermission`'s
 * `required.some(...)`) — this is confirmed against the real implementation, not assumed
 * from the sheet's "+" notation (which reads more like AND). Each button/panel below is
 * gated by an OR of several keys, so a role holding just one of them still sees it.
 */

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, ...props }: React.ComponentProps<'a'> & { href: string }) => (
    <a href={href} {...props} />
  ),
}))

vi.mock('@/features/dashboard/(components)/dashboard-events', () => ({
  default: () => <div>DashboardEvents</div>,
}))

vi.mock('@/features/dashboard/(components)/dashboard-charts', () => ({
  default: () => <div>DashboardCharts</div>,
}))

function renderDashboard() {
  return render(
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      <DashboardMain />
    </NextIntlClientProvider>,
  )
}

function setPermissions(permissions: string[] | null) {
  useUserStore.setState({ permissions })
}

describe('DashboardMain', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-28T12:00:00.000Z'))
    useUserStore.setState({
      user: {},
      permissions: null,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows the generic welcome text when the account has no first/last name', () => {
    useUserStore.setState({ user: {} })

    renderDashboard()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Chào mừng bạn đến với bảng điều khiển!',
    )
  })

  it("shows a name-based Vietnamese morning greeting with the user's name", () => {
    useUserStore.setState({ user: { firstName: 'Hai', lastName: 'Nguyen' } })
    vi.setSystemTime(new Date('2026-08-28T06:00:00.000Z')) // 06:00 UTC -> morning window

    renderDashboard()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Chào buổi sáng, Hai Nguyen')
  })

  it('shows both Create Event and Go to Calendar, plus Your Upcoming Events, for an admin (wildcard permission)', () => {
    setPermissions(['*'])

    renderDashboard()

    expect(screen.getByRole('link', { name: /Tạo sự kiện/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Đến lịch/i })).toBeInTheDocument()
    expect(screen.getByText('DashboardEvents')).toBeInTheDocument()
  })

  it('shows Create Event when the role has only Event.Create (OR-gated, not requiring Event.Management too)', () => {
    setPermissions([PERMISSIONS.Event.Create])

    renderDashboard()

    expect(screen.getByRole('link', { name: /Tạo sự kiện/i })).toBeInTheDocument()
  })

  it('shows Go to Calendar when the role has only Event.List.Draft', () => {
    setPermissions([PERMISSIONS.Event.List.Draft])

    renderDashboard()

    expect(screen.getByRole('link', { name: /Đến lịch/i })).toBeInTheDocument()
  })

  it('shows Your Upcoming Events when the role has only Event.List.Active', () => {
    setPermissions([PERMISSIONS.Event.List.Active])

    renderDashboard()

    expect(screen.getByText('DashboardEvents')).toBeInTheDocument()
  })

  it('hides Create Event, Go to Calendar and Your Upcoming Events for a role with none of the required keys (e.g. Marketing)', () => {
    setPermissions([PERMISSIONS.Calendar.Management])

    renderDashboard()

    expect(screen.queryByRole('link', { name: /Tạo sự kiện/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Đến lịch/i })).not.toBeInTheDocument()
    expect(screen.queryByText('DashboardEvents')).not.toBeInTheDocument()
  })

  it('still renders the Metrics charts even when every other block is hidden for an invalid role', () => {
    setPermissions([PERMISSIONS.Calendar.Management])

    renderDashboard()

    // DashboardCharts is not wrapped in a ComponentGuard at all — it always renders
    // regardless of the Event.* permission gates above.
    expect(screen.getByText('DashboardCharts')).toBeInTheDocument()
  })
})
