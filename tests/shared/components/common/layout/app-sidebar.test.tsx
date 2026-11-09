import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppSidebar } from '@/shared/components/common/layout/app-sidebar';
import { useUserStore } from '@/shared/stores/use-user-store';
import viMessages from '@/messages/vi.json';

vi.mock('next/image', () => ({ default: () => null }));
vi.mock('@/lib/api', () => ({ clientLogout: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    <a href={href} {...props}>{children}</a>,
  usePathname: () => '/dashboards',
}));
vi.mock('@/shared/components/ui/sidebar', () => {
  const Wrap = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Sidebar: Wrap, SidebarContent: Wrap, SidebarFooter: Wrap, SidebarGroup: Wrap,
    SidebarGroupContent: Wrap, SidebarHeader: Wrap, SidebarMenu: Wrap,
    SidebarMenuButton: Wrap, SidebarMenuItem: Wrap, SidebarRail: Wrap,
  };
});

function renderSidebar() {
  render(
    <NextIntlClientProvider locale="vi" messages={viMessages}>
      <AppSidebar />
    </NextIntlClientProvider>,
  );
}

describe('AppSidebar module visibility', () => {
  beforeEach(() => useUserStore.setState({ navbar: null }));

  it.each([null, []])('always shows Dashboard and Settings when navbar is %s', (navbar) => {
    useUserStore.setState({ navbar });
    renderSidebar();
    expect(screen.getByTestId('sidebar-dashboards')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-event-timeline')).not.toBeInTheDocument();
  });

  it.each([
    { navbar: ['event-timeline'] },
    { navbar: ['*'] },
  ])('shows Event Timeline for navbar $navbar', ({ navbar }) => {
    useUserStore.setState({ navbar });
    renderSidebar();
    expect(screen.getByTestId('sidebar-event-timeline')).toBeInTheDocument();
  });

  it('does not treat a legacy action permission as Event Timeline access', () => {
    useUserStore.setState({ navbar: ['event.create'] });
    renderSidebar();
    expect(screen.queryByTestId('sidebar-event-timeline')).not.toBeInTheDocument();
  });
});
