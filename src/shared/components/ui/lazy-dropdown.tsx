'use client'

import type { ComponentType, SVGProps } from 'react'
import { ChevronDown, ListFilter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { LoadingIcon } from '@/shared/components/common/icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'

type LazyDropdownProps<T> = {
  label: string
  isActive?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  items: T[]
  selectedId: string | null | undefined
  onSelect: (id: string | null) => void
  allLabel: string
  getItemId: (item: T) => string
  getItemLabel: (item: T) => string
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  align?: 'start' | 'center' | 'end'
  width?: string
  triggerClassName?: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  showIcon?: boolean
  iconPosition?: 'start' | 'end'
}

export function LazyDropdown<T>({
  label,
  isActive,
  open,
  onOpenChange,
  items,
  selectedId,
  onSelect,
  allLabel,
  getItemId,
  getItemLabel,
  isLoading = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  align = 'start',
  width = 'w-48',
  triggerClassName,
  icon: Icon = ListFilter,
  showIcon = true,
  iconPosition = 'start',
}: LazyDropdownProps<T>) {
  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 20 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage?.()
    }
  }

  function handleSelect(id: string | null) {
    onSelect(id)
    onOpenChange(false)
  }

  const dropdownIcon = showIcon ? (
    <Icon
      data-slot="lazy-dropdown-icon"
      data-icon={iconPosition === 'start' ? 'inline-start' : 'inline-end'}
      aria-hidden="true"
    />
  ) : null

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 max-w-40 gap-1 bg-card',
            isActive &&
            'border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
            triggerClassName,
          )}
        >
          {iconPosition === 'start' && dropdownIcon}
          <span className="truncate">{label}</span>
          {iconPosition === 'end' && dropdownIcon}
          <ChevronDown className="size-3.5 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn(width, 'p-1')}>
        <div className="max-h-60 overflow-y-auto _custom-scroll" onScroll={handleScroll}>
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              'w-full rounded px-3 py-1.5 text-left text-sm transition-colors',
              !isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
            )}
          >
            {allLabel}
          </button>
          {isLoading && (
            <div className="flex justify-center py-2">
              <LoadingIcon className="size-4 text-primary" />
            </div>
          )}
          {items.map((item) => {
            const id = getItemId(item)
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                translate="no"
                className={cn(
                  'w-full rounded px-3 py-1.5 text-left text-sm transition-colors',
                  selectedId === id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {getItemLabel(item)}
              </button>
            )
          })}
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <LoadingIcon className="size-4 text-primary" />
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
