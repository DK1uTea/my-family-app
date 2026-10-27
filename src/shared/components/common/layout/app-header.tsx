'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { AlignJustifyIcon } from 'lucide-react'
import { useSidebar } from '@/shared/components/ui/sidebar'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { getUserInitials } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { IconLogout, IconUserSettings } from '@/shared/components/common/icons'
import { AppBreadcrumbs } from './app-breadcrumbs'
import { Link } from '@/i18n/navigation'
import { clientLogout } from '@/lib/api'
import { useUserStore } from '@/shared/stores/use-user-store'

export function AppHeader() {
  const tCommon = useTranslations('common')
  const tNav = useTranslations('navigation')
  const { toggleSidebar } = useSidebar()

  return (
    <header className="sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-border bg-background-header px-6 py-3">
      {/* Mobile: logo */}
      <div className="md:hidden">
        <Image src="/images/logo_red.png" alt="CCEP" width={800} height={143} priority className="object-contain w-auto h-15" />
      </div>

      {/* Desktop: breadcrumbs */}
      <div className="hidden flex-1 md:flex">
        <AppBreadcrumbs />
      </div>
      <div className="flex-1 md:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Avatar — desktop only */}
        <div className="hidden md:block">
          <UserMenu logoutLabel={tCommon('logout')} userSettingsLabel={tNav('userSettings')} />
        </div>

        {/* Sidebar trigger — mobile only */}
        <Button
          data-sidebar="trigger"
          data-slot="sidebar-trigger"
          variant="light-gray"
          className="md:hidden size-10 rounded-md p-0"
          onClick={toggleSidebar}
        >
          <AlignJustifyIcon className="size-5" />
          <span className="sr-only">{tCommon('toggleSidebar')}</span>
        </Button>
      </div>
    </header>
  )
}

function UserMenu({ logoutLabel, userSettingsLabel }: { logoutLabel: string; userSettingsLabel: string }) {
  const user = useUserStore(state => state.user)
  const displayName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || ''
  const initials = getUserInitials(displayName || user.email)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await clientLogout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative outline-none">
          <Avatar className="size-10">
            <AvatarImage src={user.avatar || undefined} alt={displayName || user.email || 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-background bg-green-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-3 p-3">
          <Avatar className="size-10">
            <AvatarImage src={user.avatar || undefined} alt={displayName || user.email || 'User'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{displayName || '-'}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email || '-'}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/user-settings">
            <IconUserSettings className="size-4" />
            {userSettingsLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="p-1">
          <Button className="w-full gap-2" size="default" isLoading={isLoggingOut} onClick={handleLogout}>
            <IconLogout className="size-4" />
            {logoutLabel}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
