'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/shared/components/ui/button'
import { MaintenanceView } from '@/shared/components/common/maintenance'
import { getErrorStatus, isMaintenanceStatus } from '@/lib/get-error-status'

type Props = {
  error: Error
}

export function ErrorPage({ error }: Props) {
  const t = useTranslations('common.error')
  const reset = () => {
    window.location.reload()
  }

  // A backend outage (>=400, excluding 401/403 — see `@/lib/query-config`) shows the
  // module-scoped maintenance screen instead of the generic error, without covering
  // the sidebar so the user can still navigate to another module.
  if (isMaintenanceStatus(getErrorStatus(error))) {
    return <MaintenanceView fullPage={false} onRetry={reset} />
  }

  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <svg viewBox="0 0 24 24" fill="none" className="size-8 text-destructive" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{error.message || t('description')}</p>
      </div>
      <Button variant="default" onClick={reset}>
        {t('retry')}
      </Button>
    </div>
  )
}
