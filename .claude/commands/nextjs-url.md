# URL State & Deep Linking

All URL param management goes through `useQueryStates` from nuqs. This is the only pattern — no exceptions.

## Setup

`NuqsAdapter` is already in `src/app/[locale]/layout.tsx`. No additional setup needed.

## Pattern — useQueryStates (always)

```ts
// (hooks)/use-user-filters.ts
'use client';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';

const userFiltersParsers = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(''),
  sort: parseAsString.withDefault(''),
};

export function useUserFilters() {
  const [filters, setFilters] = useQueryStates(userFiltersParsers);
  // shallow: true (nuqs default) — URL updates instantly, no server re-render
  // TanStack Query still refetches because queryKey changes

  function updateFilters(updates: Partial<typeof filters>) {
    const patch = { ...updates } as Partial<typeof filters>;
    if (!('page' in updates)) patch.page = 1; // reset page on filter change
    setFilters(patch);
  }

  return { filters, setFilters: updateFilters };
}
```

## Connecting to TanStack Query

```ts
export function useUserData() {
  const { filters } = useUserFilters();
  return useQuery({
    queryKey: ['users', filters],   // queryKey change → TanStack Query refetch
    queryFn: () => getUsers(filters),
  });
}
```

## Single-param variant

```ts
import { parseAsString, useQueryState } from 'nuqs';
const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
```

## Available Parsers

| Parser | Type | Usage |
|--------|------|-------|
| `parseAsInteger` | `number` | page, perPage |
| `parseAsString` | `string` | search, sort |
| `parseAsBoolean` | `boolean` | toggles |
| `parseAsStringEnum(values)` | union | status, tab |
| `parseAsArrayOf(parseAsString)` | `string[]` | multi-select |

## Key Rules

- **ALWAYS `useQueryStates`** for ALL URL param updates — no exceptions
- **NEVER `shallow: false`** — nuqs default is correct; TanStack Query refetches via queryKey
- **NEVER `useState`** for search, filter, pagination, sort
- **NEVER `window.history.pushState`** — always use nuqs
- Reset page to 1 when filter/search/sort changes
- Debounce search inputs 300–500ms
