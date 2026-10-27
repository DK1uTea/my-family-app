'use client'

import { useState } from 'react'
import { SearchIcon, XIcon } from 'lucide-react'
import { useQueryState, parseAsString } from 'nuqs'
import { useDebouncedCallback } from 'use-debounce'
import { useTranslations } from 'next-intl'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/shared/components/ui/input-group'

type Props = {
  searchKey?: string
  placeholder?: string
  useDebounced?: boolean
  debounceDelay?: number
  className?: string
  onSearchAction?: (value: string) => void
  testId?: string
}

export function SearchInput({
  searchKey = 'keyword',
  placeholder,
  useDebounced = false,
  debounceDelay = 500,
  className,
  onSearchAction,
  testId,
}: Props) {
  const t = useTranslations('common')
  const [keyword, setKeyword] = useQueryState(searchKey, parseAsString.withDefault(''))
  const [inputValue, setInputValue] = useState(keyword)

  function commitSearch(value: string) {
    const nextKeyword = value.trim()
    setKeyword(nextKeyword || null)
    onSearchAction?.(nextKeyword)
  }

  const debouncedSetKeyword = useDebouncedCallback((value: string) => {
    commitSearch(value)
  }, debounceDelay)

  function handleChange(value: string) {
    setInputValue(value)
    if (useDebounced) debouncedSetKeyword(value)
  }

  function handleSearch() {
    debouncedSetKeyword.cancel()
    commitSearch(inputValue)
  }

  function handleClear() {
    debouncedSetKeyword.cancel()
    setInputValue('')
    commitSearch('')
  }

  return (
    <InputGroup className={className}>
      <InputGroupAddon>
        <SearchIcon className="size-4" />
      </InputGroupAddon>
      <InputGroupInput
        data-testid={testId}
        translate="no"
        placeholder={placeholder ?? t('searchPlaceholder')}
        aria-label={placeholder ?? t('searchPlaceholder')}
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSearch()
        }}
      />
      {inputValue && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label={t('clear')} onClick={handleClear}>
            <XIcon />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
