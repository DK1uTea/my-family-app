'use client'

import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { useBreadcrumbStore } from '@/shared/stores/use-breadcrumb-store'

function segmentToLabel(segment: string): string {
  return segment.replace(/-/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}

type NavLabelKey = Parameters<ReturnType<typeof useTranslations<'navigation'>>>[0]

/** Maps a top-level route segment to its translation key in the `navigation` namespace. */
const SEGMENT_NAV_KEYS: Record<string, NavLabelKey> = {
  'calendar-dashboard': 'calendarDashboardBreadcrumb',
  events: 'eventsBreadcrumb',
  rent: 'rentBreadcrumb',
  'customer-activation': 'customerActivation',
  'reporting-tool': 'reportingTool',
  'user-settings': 'userSettings',
}

export function AppBreadcrumbs() {
  const t = useTranslations('navigation')
  const pathname = usePathname()
  const customItems = useBreadcrumbStore((s) => s.items)

  const dashboardLink = (
    <BreadcrumbItem>
      <BreadcrumbLink asChild className="text-xs text-muted-foreground/70">
        <Link href="/">{t('dashboards').toUpperCase()}</Link>
      </BreadcrumbLink>
    </BreadcrumbItem>
  )

  if (customItems) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {dashboardLink}
          {customItems.map((item, idx) => {
            const isLast = idx === customItems.length - 1
            return (
              <Fragment key={`${item.label}-${idx}`}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast || !item.href ? (
                    <BreadcrumbPage className="text-xs text-foreground">
                      {item.label.toUpperCase()}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild className="text-xs text-muted-foreground/70">
                      <Link href={item.href}>{item.label.toUpperCase()}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            )
          })}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const segments = pathname.split('/').filter((s) => Boolean(s) && s !== 'dashboards')
  const isRoot = segments.length === 0

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isRoot ? (
            <BreadcrumbPage className="text-xs text-foreground">
              {t('dashboards').toUpperCase()}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild className="text-xs text-muted-foreground/70">
              <Link href="/">{t('dashboards').toUpperCase()}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {segments.map((segment, idx) => {
          const isLast = idx === segments.length - 1
          const href = '/' + segments.slice(0, idx + 1).join('/')
          const navKey = idx === 0 ? SEGMENT_NAV_KEYS[segment] : undefined
          const label = navKey ? t(navKey) : segmentToLabel(segment)
          return (
            <Fragment key={segment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="text-xs text-foreground">
                    {label.toUpperCase()}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="text-xs text-muted-foreground/70">
                    <Link href={href}>{label.toUpperCase()}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
