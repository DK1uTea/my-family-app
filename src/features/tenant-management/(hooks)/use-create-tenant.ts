'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiProxy } from '@/lib/api'
import { tenantQueryKey, type Tenant } from './use-tenants'
import type { TenantFormValues } from '../(helpers)/tenant-form-schema'

type TenantResponse = { data: { tenant: Tenant } }

export function useCreateTenant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: TenantFormValues) =>
      (await apiProxy.post<TenantResponse>('/tenants', payload)).data.data.tenant,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKey }),
  })
}
