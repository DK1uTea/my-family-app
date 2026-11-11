'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiProxy } from '@/lib/api'
import { tenantQueryKey, type Tenant } from './use-tenants'

type TenantResponse = { data: { tenant: Tenant } }

export function useActivateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenantId: string) =>
      (await apiProxy.patch<TenantResponse>(`/tenants/${tenantId}/activate`))
        .data.data.tenant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKey }),
  })
}
