'use client'

import { useTranslations } from 'next-intl'
import { Building2, Pencil, Power } from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { OptionMenu } from '@/shared/components/ui/option-menu'
import { Pagination } from '@/shared/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import type { PaginationType } from '@/shared/types/pagination-type'
import { useDateFormat } from '@/shared/stores/use-user-store'
import type { Tenant } from '../(hooks)/use-tenants'

type Props = {
  tenants?: Tenant[]
  pagination?: PaginationType
  page: number
  limit: number
  isLoading: boolean
  isError: boolean
  busy: boolean
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onEdit: (tenant: Tenant) => void
  onStatus: (tenant: Tenant) => void
  onAdd: () => void
}

const TABLE_COLUMNS = [
  'id',
  'name',
  'description',
  'status',
  'createdAt',
  'actions',
] as const

function TenantTableLoadingRows() {
  return Array.from({ length: 5 }, (_, row) => (
    <TableRow key={row} aria-hidden="true">
      {TABLE_COLUMNS.map((column) => (
        <TableCell key={column}>
          <Skeleton className={column === 'actions' ? 'size-8' : 'h-5 w-full max-w-40'} />
        </TableCell>
      ))}
    </TableRow>
  ))
}

export function TenantTable({
  tenants,
  pagination,
  page,
  limit,
  isLoading,
  isError,
  busy,
  onPageChange,
  onLimitChange,
  onEdit,
  onStatus,
  onAdd,
}: Props) {
  const t = useTranslations('tenantManagement')
  const dateFormat = useDateFormat()
  const rows = Array.isArray(tenants) ? tenants : []
  const totalPages = pagination?.totalPages ?? 0

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border bg-card">
        {isLoading ? (
          <p role="status" className="sr-only">
            {t('loading')}
          </p>
        ) : null}
        <Table aria-busy={isLoading}>
          <TableHeader>
            <TableRow>
              <TableHead>{t('id')}</TableHead>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('descriptionField')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('createdAt')}</TableHead>
              <TableHead className="w-16">
                <span className="sr-only">{t('actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? <TenantTableLoadingRows /> : null}
            {isError ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMNS.length}>
                  <p role="alert" className="py-8 text-center text-destructive">
                    {t('loadError')}
                  </p>
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={TABLE_COLUMNS.length}>
                  <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-4 text-center">
                    <div className="rounded-full bg-muted p-3">
                      <Building2 aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="font-medium">{t('emptyTitle')}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('emptyDescription')}
                      </p>
                    </div>
                    <Button type="button" onClick={onAdd}>
                      {t('add')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !isError
              ? rows.map((tenant) => (
                  <TableRow
                    key={tenant.id}
                    data-testid={`tenant-row-${tenant.id}`}
                  >
                    <TableCell className="font-medium">{tenant.id}</TableCell>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell className="max-w-64 truncate">
                      {tenant.description || t('noDescription')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tenant.isActive ? 'default' : 'secondary'}
                      >
                        {t(tenant.isActive ? 'active' : 'inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(tenant.createdAt, dateFormat)}
                    </TableCell>
                    <TableCell>
                      <OptionMenu
                        triggerLabel={t('rowActions', { name: tenant.name })}
                        items={[
                          {
                            key: 'edit',
                            label: t('edit'),
                            icon: <Pencil aria-hidden="true" />,
                            onClick: () => onEdit(tenant),
                          },
                          {
                            key: 'status',
                            label: t(
                              tenant.isActive ? 'deactivate' : 'activate',
                            ),
                            icon: <Power aria-hidden="true" />,
                            onClick: () => onStatus(tenant),
                            disabled: busy,
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select
          value={String(limit)}
          onValueChange={(value) => onLimitChange(Number(value))}
        >
          <SelectTrigger
            aria-label={t('rowsPerPage')}
            className="w-20 self-end sm:self-auto"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          disabled={busy || isLoading}
          onPageChange={onPageChange}
          className="sm:mx-0 sm:w-auto sm:flex-1 sm:justify-end"
        />
      </footer>
    </div>
  )
}
