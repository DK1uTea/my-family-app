'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { IconLogout } from '@/shared/components/common/icons';
import { clientLogout } from '@/lib/api';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/shared/components/ui/sidebar';
import { LayoutDashboard, Settings } from 'lucide-react';

const NAV_ITEMS = [
  {
    href: '/dashboards',
    label: 'Dashboard',
    Icon: LayoutDashboard,
  },
  {
    href: '/settings',
    label: 'Settings',
    Icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const tCommon = useTranslations('common');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await clientLogout();
  };

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
            <SidebarMenu className='gap-1.5'>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href} className="flex items-center gap-2">
                        <item.Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={tCommon('logout')}
              aria-busy={isLoggingOut}
              tooltip={tCommon('logout')}
            >
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
