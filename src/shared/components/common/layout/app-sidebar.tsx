'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, LayoutDashboard, Settings } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/shared/components/ui/sidebar';

type SidebarChildItem = {
  href: string;
  label: string;
};

type SidebarNavItem = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  children?: SidebarChildItem[];
};

const NAV_ITEMS: SidebarNavItem[] = [
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

function SidebarNavItem({ item, pathname }: { item: SidebarNavItem; pathname: string }) {
  const [expanded, setExpanded] = useState(pathname.startsWith(`${item.href}/`));
  const hasChildren = Boolean(item.children?.length);
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const subnavId = `sidebar-subnav-${item.href.replaceAll('/', '-')}`;

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
          <Link href={item.href} className="flex items-center gap-2">
            <item.Icon aria-hidden="true" className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        isActive={isActive}
        tooltip={item.label}
        aria-expanded={expanded}
        aria-controls={subnavId}
        onClick={() => setExpanded((previous) => !previous)}
      >
        <item.Icon aria-hidden="true" className="h-4 w-4" />
        <span className="flex-1 truncate">{item.label}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
        />
      </SidebarMenuButton>
      <SidebarMenuSub id={subnavId} hidden={!expanded}>
        {item.children?.map((child) => (
          <SidebarMenuSubItem key={child.href}>
            <SidebarMenuSubButton asChild isActive={pathname === child.href}>
              <Link href={child.href}>{child.label}</Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ))}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
}

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
            <SidebarMenu className="gap-1.5">
              {NAV_ITEMS.map((item) => (
                <SidebarNavItem key={item.href} item={item} pathname={pathname} />
              ))}
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
