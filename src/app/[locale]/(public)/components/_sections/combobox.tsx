'use client'

import { useState } from 'react'

import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/shared/components/ui/combobox'
import { ComboboxFloat, type ComboboxFloatOption } from '@/shared/components/ui/combobox-float'

const ALL_OPTIONS: ComboboxFloatOption[] = [
  'Next.js', 'SvelteKit', 'Nuxt.js', 'Remix', 'Astro',
  'Gatsby', 'Solid Start', 'TanStack Start', 'Qwik', 'Angular',
  'Vue.js', 'React', 'Svelte', 'Lit', 'Preact',
  'Ember.js', 'Backbone.js', 'Alpine.js', 'HTMX', 'Stimulus',
].map((fw) => ({ value: fw.toLowerCase().replace(/[.\s]+/g, '-'), label: fw }))

const PAGE_SIZE = 6

export function ComboboxSection() {
  const [single, setSingle] = useState<string | null>(null)

  // Debounce search demo — simulates API call after 500ms debounce
  const [searchValue, setSearchValue] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchOptions, setSearchOptions] = useState(ALL_OPTIONS.slice(0, 8))

  function handleSearchChange(query: string) {
    setSearching(true)
    setTimeout(() => {
      setSearchOptions(
        query
          ? ALL_OPTIONS.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
          : ALL_OPTIONS.slice(0, 8),
      )
      setSearching(false)
    }, 300)
  }

  // Loadmore demo — simulates paginated API
  const [loadMoreValue, setLoadMoreValue] = useState('')
  const [page, setPage] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)
  const [pagedOptions, setPagedOptions] = useState(ALL_OPTIONS.slice(0, PAGE_SIZE))

  function handleLoadMore() {
    if (loadingMore || page * PAGE_SIZE >= ALL_OPTIONS.length) return
    setLoadingMore(true)
    setTimeout(() => {
      const next = page + 1
      setPagedOptions(ALL_OPTIONS.slice(0, next * PAGE_SIZE))
      setPage(next)
      setLoadingMore(false)
    }, 600)
  }

  return (
    <section className="space-y-8">
      <h2 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
        Combobox
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Single select — searchable</p>
          <Combobox value={single} onValueChange={setSingle}>
            <ComboboxInput placeholder="Select a framework..." showTrigger showClear={!!single} className="w-full" />
            <ComboboxContent>
              <ComboboxList>
                {ALL_OPTIONS.slice(0, 8).map((opt) => (
                  <ComboboxItem key={opt.value} value={opt.value}>{opt.label}</ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Disabled</p>
          <Combobox disabled>
            <ComboboxInput placeholder="Disabled combobox" showTrigger disabled className="w-full" />
          </Combobox>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Float — debounced search (500 ms delay → fake API filter)
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <ComboboxFloat
            label="Framework"
            value={searchValue}
            onValueChange={setSearchValue}
            onSearchChange={handleSearchChange}
            options={searchOptions}
            loadingMore={searching}
          />
          <ComboboxFloat
            label="Framework (error)"
            value=""
            options={ALL_OPTIONS.slice(0, 4)}
            error="This field is required"
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium text-muted-foreground">
          Float — scroll loadmore ({PAGE_SIZE} per page, {ALL_OPTIONS.length} total)
        </p>
        <div className="max-w-sm">
          <ComboboxFloat
            label="Framework"
            value={loadMoreValue}
            onValueChange={setLoadMoreValue}
            options={pagedOptions}
            onLoadMore={handleLoadMore}
            hasMore={page * PAGE_SIZE < ALL_OPTIONS.length}
            loadingMore={loadingMore}
          />
        </div>
      </div>
    </section>
  )
}
