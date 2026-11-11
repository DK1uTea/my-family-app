'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiProxy } from '@/lib/api'
import { tenantQueryKey, type Tenant } from './use-tenants'

type TenantResponse = { data: { tenant: Tenant } }

export function useUpdateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { id: string; name: string; description: string }) =>
      (await apiProxy.patch<TenantResponse>(`/tenants/${payload.id}`, {
        name: payload.name,
        description: payload.description,
      })).data.data.tenant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKey }),
  })
}
