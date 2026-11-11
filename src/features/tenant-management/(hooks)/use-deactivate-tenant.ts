'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiProxy } from '@/lib/api'
import { tenantQueryKey, type Tenant } from './use-tenants'

type TenantResponse = { data: { tenant: Tenant } }

export function useDeactivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenantId: string) =>
      (await apiProxy.patch<TenantResponse>(`/tenants/${tenantId}/deactivate`))
        .data.data.tenant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKey }),
  })
}
