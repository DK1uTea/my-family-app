'use client'

import { useQuery } from '@tanstack/react-query'
import { apiProxy } from '@/lib/api'
import type { PaginationType } from '@/shared/types/pagination-type'
import type { TenantSort } from '@/shared/types/tenant-sort'

export type Tenant = {
  id: string
  name: string
  description: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type TenantListResponse = { items: Tenant[]; pagination: PaginationType }

export const tenantQueryKey = ['tenant-management']

export function useTenants(search: string, page: number, limit: number, sort: TenantSort) {
  return useQuery({
    queryKey: [...tenantQueryKey, search, page, limit, sort],
    queryFn: async () => {
      const response = await apiProxy.get<{ data: TenantListResponse }>('/tenants', {
        params: { search, page, limit, sort },
      })
      return response.data.data
    },
  })
}
