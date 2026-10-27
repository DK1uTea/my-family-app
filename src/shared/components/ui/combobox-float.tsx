'use client'

import { useEffect, useId, useState, type ReactNode } from 'react'
import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useDebouncedCallback } from 'use-debounce'

import { cn } from '@/lib/utils'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from '@/shared/components/ui/combobox'

export type ComboboxFloatOption = { value: string; label: string }

type Props = {
  label: string
  value?: string | null
  onValueChange?: (value: string) => void
  onSearchChange?: (value: string) => void
  debounceDelay?: number
  options?: ComboboxFloatOption[]
  emptyContent?: ReactNode
  onLoadMore?: () => void
  hasMore?: boolean
  loadingMore?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
}

export function ComboboxFloat({
  label,
  value,
  onValueChange,
  onSearchChange,
  debounceDelay = 500,
  options = [],
  emptyContent,
  onLoadMore,
  hasMore,
  loadingMore,
  error,
  hint,
  disabled,
  className,
}: Props) {
  const t = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const labelId = useId()

  const debouncedSearch = useDebouncedCallback(
    (val: string) => onSearchChange?.(val),
    debounceDelay,
  )

  // Pass the full option object so base-ui auto-reads `.label` for input display
  const selectedOption = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    setInputValue(value ? selectedOption?.label ?? '' : '')
  }, [selectedOption?.label, value])

  const handleInputValueChange = (nextInputValue: string) => {
    setInputValue(nextInputValue)
    debouncedSearch(nextInputValue)
  }

  const handleValueChange = (nextValue: ComboboxFloatOption | null) => {
    setInputValue(nextValue?.label ?? '')
    onValueChange?.(nextValue?.value ?? '')
  }

  const handleClear = () => {
    debouncedSearch.cancel()
    setInputValue('')
    onSearchChange?.('')
    onValueChange?.('')
  }

  const isFloating = open || Boolean(value) || Boolean(inputValue) || !!error
  const showClear = Boolean(value) || Boolean(inputValue)

  const containerCls = cn(
    'relative h-13.5 w-full rounded-select-float border bg-background transition-colors',
    open
      ? error ? 'border-destructive' : 'border-primary'
      : error ? 'border-destructive' : 'border-input hover:border-primary',
    disabled && 'pointer-events-none opacity-50',
  )

  const labelCls = cn(
    'pointer-events-none absolute left-3 top-0 z-10 select-none transition-all duration-200',
    isFloating ? 'translate-y-2 text-[11px]' : 'translate-y-4.25 text-[13px]',
    error ? 'text-destructive' : 'text-muted-foreground',
  )

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className={containerCls}>
        <Combobox
          items={options}
          filter={null}
          value={selectedOption}
          inputValue={inputValue}
          onValueChange={handleValueChange}
          isItemEqualToValue={(a: ComboboxFloatOption | null, b: ComboboxFloatOption | null) =>
            a?.value === b?.value
          }
          onInputValueChange={handleInputValueChange}
          onOpenChange={setOpen}
          disabled={disabled}
        >
          <ComboboxPrimitive.Input
            translate="no"
            aria-labelledby={labelId}
            className={cn(
              'h-13.5 w-full rounded-none bg-transparent pl-3 pr-17 text-sm font-medium outline-none',
              isFloating ? 'pt-5 pb-1' : 'py-0',
            )}
            disabled={disabled}
          />
          {showClear && (
            <button
              type="button"
              aria-label={t('clear')}
              className="absolute right-9 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              disabled={disabled}
              onClick={handleClear}
            >
              <XIcon className="size-4 pointer-events-none" />
            </button>
          )}
          <ComboboxPrimitive.Trigger
            aria-label={t('showOptions')}
            className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-muted-foreground"
          >
            <ChevronDownIcon
              className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
            />
          </ComboboxPrimitive.Trigger>
          <ComboboxContent
            sideOffset={3}
            className="min-w-(--anchor-width)!"
          >
            <ComboboxList onLoadMore={onLoadMore} hasMore={hasMore} loadingMore={loadingMore}>
              {options.map((opt) => (
                <ComboboxItem key={opt.value} value={opt}>
                  {opt.label}
                </ComboboxItem>
              ))}
              <ComboboxEmpty>{emptyContent ?? t('noResults')}</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <label id={labelId} className={labelCls}>{label}</label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
