'use client';

import Image from 'next/image';
import { LayoutDashboard, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { IconEventTimeline, IconLogout } from '@/shared/components/common/icons';
import { clientLogout } from '@/lib/api';
import { useUserStore } from '@/shared/stores/use-user-store';
import { ModuleKey, PERMISSION_ALL_WILDCARD } from '@/shared/constants/permissions';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from '@/shared/components/ui/sidebar';

type NavItem = {
  href: string;
  testId: string;
  labelKey: 'dashboards' | 'eventTimeline' | 'userSettings';
  Icon: React.ComponentType<{ className?: string }>;
  navbarKey?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboards', testId: 'sidebar-dashboards', labelKey: 'dashboards', Icon: LayoutDashboard },
  { href: '/event-timeline', testId: 'sidebar-event-timeline', labelKey: 'eventTimeline', Icon: IconEventTimeline, navbarKey: ModuleKey.EventTimeline },
  { href: '/settings', testId: 'sidebar-settings', labelKey: 'userSettings', Icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const navbar = useUserStore((state) => state.navbar);
  const visibleItems = NAV_ITEMS.filter((item) =>
    !item.navbarKey || (Array.isArray(navbar) &&
      (navbar.includes(PERMISSION_ALL_WILDCARD) || navbar.includes(item.navbarKey))),
  );

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Image
          src="/images/logo.png"
          alt={tCommon('logoAlt')}
          width={1000}
          height={240}
          priority
          className="h-auto w-full max-w-52 object-contain"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                    tooltip={tNav(item.labelKey)}
                  >
                    <Link href={item.href} data-testid={item.testId} className="flex items-center gap-2">
                      <span aria-hidden="true"><item.Icon className="h-4 w-4" /></span>
                      <span>{tNav(item.labelKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton type="button" onClick={clientLogout} tooltip={tCommon('logout')}>
              <IconLogout aria-hidden="true" />
              <span>{tCommon('logout')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
