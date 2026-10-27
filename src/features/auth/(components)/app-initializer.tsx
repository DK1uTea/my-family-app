'use client'

import { useMe } from '../(hooks)/use-me'
import { LoadingIcon } from '@/shared/components/common/icons'
import { MaintenanceView } from '@/shared/components/common/maintenance'

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const { isPending, isMaintenance, refetch } = useMe()

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingIcon className="size-10" />
      </div>
    )
  }

  // Global endpoints (get me, ...) gate the whole app — an outage here replaces
  // the sidebar too, since there is nothing to navigate to without a user session.
  if (isMaintenance) {
    return <MaintenanceView fullPage onRetry={() => refetch()} />
  }

  return <>{children}</>
}
