'use client'

import type { ComponentType, SVGProps } from 'react'
import { CalendarRange, ListFilter } from 'lucide-react'
import { useQueryStates, parseAsString } from 'nuqs'
import { useDebouncedCallback } from 'use-debounce'
import { useTranslations } from 'next-intl'

import { dayjs } from '@/lib/date-utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'
import { DateRangePicker } from '../ui/date-range-picker'
import { SearchInput } from './search-input'

type OptionItem = { value: string; label: string }

const ALL_SENTINEL = '__ALL__'

export type SearchFilterConfig = {
  name: string
  label?: string
  placeholder?: string
  triggerLabel?: string
  allLabel?: string
  showIcon?: boolean
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  options: OptionItem[]
  value: string
  onChange: (value: string) => void
}

export type DateRangeFilterConfig = {
  isShow?: boolean
  dateRangePlaceholder?: string
  dateRangeKey?: {
    fromKey: string
    toKey: string
  }
}

type Props = {
  className?: string
  inputClassName?: string
  placeholder?: string
  searchKey?: string
  filters?: SearchFilterConfig[]
  dateRangeFilter?: DateRangeFilterConfig
  useDebounced?: boolean
  debounceDelay?: number
  searchTestId?: string
  children?: React.ReactNode
}

function parseQueryDate(value?: string | null): Date | undefined {
  if (!value) return undefined
  const date = dayjs.utc(value)
  return date.isValid() ? date.toDate() : undefined
}

function serializeQueryDate(value?: Date): string | null {
  return value ? dayjs.utc(value).toISOString() : null
}

export function SearchFilterBar({
  className,
  inputClassName,
  placeholder,
  searchKey = 'keyword',
  filters = [],
  dateRangeFilter,
  useDebounced = true,
  debounceDelay = 500,
  searchTestId,
  children,
}: Props) {
  const t = useTranslations('common')
  const fromKey = dateRangeFilter?.dateRangeKey?.fromKey ?? 'start_date'
  const toKey = dateRangeFilter?.dateRangeKey?.toKey ?? 'end_date'

  const [dateRangeQuery, setDateRange] = useQueryStates({
    [fromKey]: parseAsString,
    [toKey]: parseAsString,
  })

  const defaultDateRange = dateRangeFilter?.isShow
    ? {
      from: parseQueryDate(dateRangeQuery[fromKey]),
      to: parseQueryDate(dateRangeQuery[toKey]),
    }
    : undefined

  const debouncedSetDateRange = useDebouncedCallback(
    ({ from, to }: { from?: Date; to?: Date }) => {
      setDateRange({
        [fromKey]: serializeQueryDate(from),
        [toKey]: serializeQueryDate(to),
      })
    },
    debounceDelay,
  )

  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      <SearchInput
        searchKey={searchKey}
        placeholder={placeholder}
        testId={searchTestId}
        useDebounced={useDebounced}
        debounceDelay={debounceDelay}
        className={cn('w-72 bg-card', inputClassName)}
      />

      {filters.map((filter) => {
        const FilterIcon = filter.icon ?? ListFilter

        return (
          <Select
            key={filter.name}
            value={filter.value || (filter.allLabel ? ALL_SENTINEL : filter.value)}
            onValueChange={(v) => filter.onChange(v === ALL_SENTINEL ? '' : v)}
          >
            <SelectTrigger
              className="h-8 w-auto min-w-18 bg-card"
              aria-label={filter.triggerLabel ?? filter.placeholder ?? filter.label ?? t('selectPlaceholder')}
            >
              {filter.triggerLabel ? (
                <span data-slot="select-value">{filter.triggerLabel}</span>
              ) : (
                <SelectValue placeholder={filter.placeholder ?? filter.label ?? t('selectPlaceholder')} />
              )}
              {filter.showIcon && <FilterIcon data-icon="inline-end" aria-hidden="true" />}
            </SelectTrigger>
            <SelectContent>
              {filter.allLabel && (
                <SelectItem value={ALL_SENTINEL}>{filter.allLabel}</SelectItem>
              )}
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      })}

      {children}

      {dateRangeFilter?.isShow && (
        <DateRangePicker
          defaultValue={defaultDateRange}
          onApplyAction={debouncedSetDateRange}
          trigger={(
            <Button variant="outline" className="h-8 shrink-0 rounded-button bg-card text-sm">
              <CalendarRange data-icon="inline-start" />
              {dateRangeFilter.dateRangePlaceholder ?? t('dateRange')}
            </Button>
          )}
        />
      )}
    </div>
  )
}
