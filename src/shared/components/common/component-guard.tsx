'use client'

import { useHasPermission } from '@/shared/stores/use-user-store'

type Props = {
  requiredKeys: string | string[]
  children: React.ReactNode
}

export function ComponentGuard({ requiredKeys, children }: Props) {
  const allowed = useHasPermission(requiredKeys)

  if (!allowed) return null

  return <>{children}</>
}
