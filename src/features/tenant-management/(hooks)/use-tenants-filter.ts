'use client'

import {
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from 'nuqs'
import { useTranslations } from 'next-intl'
import type { SearchFilterConfig } from '@/shared/components/common/search-filter-bar'
import { TENANT_SORT_OPTIONS } from '@/shared/types/tenant-sort'

export function useTenantsFilter() {
  const t = useTranslations('tenantManagement')
  const [query, setQuery] = useQueryStates(
    {
      search: parseAsString.withDefault(''),
      page: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
      sort: parseAsStringEnum([...TENANT_SORT_OPTIONS]).withDefault(
        'createdAt:desc',
      ),
    },
    { history: 'push' },
  )

  const sortFilter: SearchFilterConfig = {
    name: 'sort',
    label: t('sortLabel'),
    showIcon: true,
    value: query.sort,
    onChange: (value) => {
      const sort = TENANT_SORT_OPTIONS.find((option) => option === value)
      if (sort) setQuery({ sort, page: 1 })
    },
    options: [
      {
        value: TENANT_SORT_OPTIONS[0],
        label: t('newest'),
      },
      {
        value: TENANT_SORT_OPTIONS[1],
        label: t('oldest'),
      },
    ],
  }

  return {
    query,
    sortFilter,
    onSearch: () => setQuery({ page: 1 }),
    onPageChange: (page: number) => setQuery({ page }),
    onLimitChange: (limit: number) => setQuery({ limit, page: 1 }),
  }
}
