'use client'

import { useQueryState, useQueryStates, parseAsString } from 'nuqs'

import { SearchFilterBar } from '@/shared/components/common/search-filter-bar'
import { Button } from '@/shared/components/ui/button'

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const SORT_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'date_asc', label: 'Newest' },
  { value: 'date_desc', label: 'Oldest' },
]

export function SearchFilterBarSection() {
  const [keyword] = useQueryState('keyword', parseAsString.withDefault(''))
  const [filters, setFilters] = useQueryStates({
    status: parseAsString.withDefault(''),
    sort: parseAsString.withDefault(''),
  })

  function handleReset() {
    setFilters({ status: null, sort: null })
  }

  return (
    <section className="space-y-4">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Search Filter Bar
      </h2>
      <p className="text-sm text-muted-foreground">
        URL-synced search and filter bar. Search updates on Enter; filters update immediately.
      </p>

      <SearchFilterBar
        placeholder="Search items..."
        filters={[
          {
            name: 'status',
            placeholder: 'All Status',
            options: STATUS_OPTIONS,
            value: filters.status || 'ALL',
            onChange: (v) => setFilters({ status: v === 'ALL' ? null : v }),
          },
          {
            name: 'sort',
            placeholder: 'Sort by',
            options: SORT_OPTIONS,
            value: filters.sort || 'ALL',
            onChange: (v) => setFilters({ sort: v === 'ALL' ? null : v }),
          },
        ]}
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-lg border border-dashed border-border bg-muted/30 p-3 font-mono text-xs text-muted-foreground">
          keyword=&quot;{keyword}&quot; · status=&quot;{filters.status}&quot; · sort=&quot;{filters.sort}&quot;
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reset
        </Button>
      </div>
    </section>
  )
}
