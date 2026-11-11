'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { SearchFilterBar } from '@/shared/components/common/search-filter-bar'
import { Button } from '@/shared/components/ui/button'
import { TenantFormSheet } from './tenant-form-sheet'
import { TenantTable } from './tenant-table'
import { useTenantsFilter } from '../(hooks)/use-tenants-filter'
import { useTenants, type Tenant } from '../(hooks)/use-tenants'
import { useCreateTenant } from '../(hooks)/use-create-tenant'
import { useUpdateTenant } from '../(hooks)/use-update-tenant'
import { useActivateTenant } from '../(hooks)/use-activate-tenant'
import { useDeactivateTenant } from '../(hooks)/use-deactivate-tenant'
import type { TenantFormValues } from '../(helpers)/tenant-form-schema'

type DialogState = {
  open: boolean
  mode: 'create' | 'edit'
  tenant?: Tenant
}

export function TenantManagementMain() {
  const t = useTranslations('tenantManagement')
  const {
    query,
    sortFilter,
    onSearch,
    onPageChange,
    onLimitChange,
  } = useTenantsFilter()
  const tenantsQuery = useTenants(
    query.search,
    query.page,
    query.limit,
    query.sort,
  )
  const createTenant = useCreateTenant()
  const updateTenant = useUpdateTenant()
  const activateTenant = useActivateTenant()
  const deactivateTenant = useDeactivateTenant()
  const [dialog, setDialog] = useState<DialogState>({
    open: false,
    mode: 'create',
  })
  const busy =
    createTenant.isPending ||
    updateTenant.isPending ||
    activateTenant.isPending ||
    deactivateTenant.isPending
  function openCreateDialog() {
    setDialog({ open: true, mode: 'create' })
  }

  function openEditDialog(tenant: Tenant) {
    setDialog({ open: true, mode: 'edit', tenant })
  }

  function closeDialog(open: boolean) {
    setDialog((current) => ({ ...current, open }))
  }

  function submitTenant(values: TenantFormValues) {
    if (dialog.mode === 'create') {
      createTenant.mutate(values, {
        onSuccess: () => {
          closeDialog(false)
          toast.success(t('created'))
        },
      })
      return
    }

    if (!dialog.tenant) return

    updateTenant.mutate(
      {
        id: dialog.tenant.id,
        name: values.name,
        description: values.description,
      },
      {
        onSuccess: () => {
          closeDialog(false)
          toast.success(t('saved'))
        },
      },
    )
  }

  function toggleTenantStatus(tenant: Tenant) {
    const mutation = tenant.isActive ? deactivateTenant : activateTenant
    const successMessage = tenant.isActive ? 'deactivated' : 'activated'

    mutation.mutate(tenant.id, {
      onSuccess: () => toast.success(t(successMessage)),
    })
  }

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1
            data-testid="tenant-management-heading"
            className="text-3xl font-bold tracking-tight"
          >
            {t('title')}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('description')}</p>
        </div>
        <Button
          type="button"
          data-testid="tenant-add-button"
          onClick={openCreateDialog}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          {t('add')}
        </Button>
      </header>

      <section aria-label={t('title')} className="space-y-4">
        <SearchFilterBar
          className="w-full flex-1 sm:flex-nowrap"
          searchInputContainerClassName="min-w-0 flex-1"
          inputClassName="w-full min-w-0 bg-card"
          searchKey="search"
          searchTestId="tenant-search-input"
          searchLabel={t('searchLabel')}
          placeholder={t('searchPlaceholder')}
          filters={[sortFilter]}
          onSearchAction={onSearch}
        />

        <TenantTable
          tenants={tenantsQuery.data?.items}
          pagination={tenantsQuery.data?.pagination}
          page={query.page}
          limit={query.limit}
          isLoading={tenantsQuery.isLoading}
          isError={tenantsQuery.isError}
          busy={busy}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          onEdit={openEditDialog}
          onStatus={toggleTenantStatus}
          onAdd={openCreateDialog}
        />
      </section>

      <TenantFormSheet
        open={dialog.open}
        mode={dialog.mode}
        initial={dialog.tenant}
        busy={busy}
        onOpenChange={closeDialog}
        onSubmit={submitTenant}
      />
    </main>
  )
}
