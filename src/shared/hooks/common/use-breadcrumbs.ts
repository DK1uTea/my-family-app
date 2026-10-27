'use client'

import { useEffect } from 'react'
import { useBreadcrumbStore, type BreadcrumbItem } from '@/shared/stores/use-breadcrumb-store'

export function useBreadcrumbs(items: BreadcrumbItem[]) {
  const setItems = useBreadcrumbStore((s) => s.setItems)
  const clearItems = useBreadcrumbStore((s) => s.clearItems)
  const serialized = JSON.stringify(items)

  useEffect(() => {
    setItems(JSON.parse(serialized))
    return () => clearItems()
  }, [serialized])
}
