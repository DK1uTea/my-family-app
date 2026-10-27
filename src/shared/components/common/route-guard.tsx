'use client'

import { useHasPermission } from '@/shared/stores/use-user-store'
import { ForbiddenView } from '@/shared/components/common/forbidden-view'

type Props = {
  requiredKeys: string | string[]
  children: React.ReactNode
}

export function RouteGuard({ requiredKeys, children }: Props) {
  const allowed = useHasPermission(requiredKeys)

  if (!allowed) return <ForbiddenView />

  return <>{children}</>
}
