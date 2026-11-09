import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardMain from '@/features/dashboard/(components)/dashboard-main';
import { useUserStore } from '@/shared/stores/use-user-store';
import viMessages from '@/messages/vi.json';

function renderDashboard() {
  render(
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      <DashboardMain />
    </NextIntlClientProvider>,
  );
}

describe('DashboardMain', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T06:00:00.000Z'));
    useUserStore.setState({ user: {}, permissions: null, navbar: null });
  });

  afterEach(() => vi.useRealTimers());

  it('welcomes a signed-in user without a name', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(viMessages.dashboard.welcome);
  });

  it('greets the signed-in user by name without a module grant', () => {
    useUserStore.setState({
      user: { firstName: 'Hai', lastName: 'Nguyen' },
      permissions: [],
      navbar: [],
    });
    renderDashboard();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `${viMessages.dashboard.morning}, Hai Nguyen`,
    );
  });

  it('does not show links to removed Event and Calendar routes', () => {
    useUserStore.setState({ permissions: ['*'], navbar: ['*'] });
    renderDashboard();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
