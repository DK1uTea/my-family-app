# 04 — UI Components

## Component Hierarchy

```
src/shared/components/ui/          ← shadcn primitives (never business logic)
    accordion, alert-dialog, avatar, badge, breadcrumb
    button, calendar, card, carousel, checkbox
    combobox, dialog, dropdown-menu
    empty, input, input-float, input-group
    label, pagination, radio-group
    select, select-float, separator, sheet
    sidebar, skeleton, sonner, switch
    table, tabs, tabs-url, textarea, tooltip

src/shared/components/
    icons/                         ← ALL custom SVG icons (one file per icon)
    (shared when used by multiple features)

src/features/<name>/(components)/  ← Feature-scoped components
```

## Component Rules

- **1 component per file**, kebab-case filename (`user-card.tsx`)
- **Max 200 lines** — split into sub-components or extract logic to hooks
- **`'use client'`** required for any file using hooks, event handlers, or browser APIs
- Server Components are the default — add `'use client'` only when needed
- **No `forwardRef`** — `ref` is a plain prop in React 19
- **No `useMemo` / `useCallback` / `memo`** — React Compiler handles memoization

## Skeleton Pattern + `loading.tsx`

Every component that fetches data ships a sibling `*-skeleton.tsx` using shadcn `<Skeleton>` (`@/shared/components/ui/skeleton`) — **never a hand-rolled `<div className="animate-pulse ...">`**, including inline loading rows inside tables/lists. Page routes display the skeleton via `loading.tsx` (React Suspense boundary):

```
features/users/(components)/
  users-table.tsx           ← real component
  users-table-skeleton.tsx  ← loading state

app/[locale]/(private)/users/
  page.tsx                  ← renders <UsersTable>
  loading.tsx               ← renders <UsersTableSkeleton>
  error.tsx                 ← renders <ErrorPage>
```

**Why `loading.tsx` matters:** Next.js streams the page shell to the browser immediately and mounts the skeleton before any data is fetched. The user sees a responsive layout instantly — there is no blank white screen as in traditional SSR.

## Custom Icons (`src/shared/components/common/icons/`)

All SVG icons live in their own file and are re-exported from `index.tsx`:

```
src/shared/components/common/icons/
├── index.tsx          ← re-exports every icon
├── icon-cube.tsx      ← one icon per file (kebab-case filename)
└── ...
```

```tsx
// ✅ Correct
import { IconCube } from '@/shared/components/common/icons';
<IconCube className="size-6" />

// ❌ Never inline raw SVG in a component file
```

Icon rules:
- **One icon per file** — kebab-case filename matching the export (`icon-cube.tsx` → `IconCube`)
- **`fill="currentColor"`** on `<svg>` — color inherited from parent's `text-*` class
- **Only `className?: string` prop** — no `color` prop; parent controls color with Tailwind
- **No `width`/`height` on `<svg>`** — size set via `className` (e.g. `size-5`)
- **Update `index.tsx`** with a named re-export for every new icon
- Naming: `Icon<PascalName>` (e.g. `IconDashboards`, `IconCart`)

## TabsUrl (URL-synced tabs)

`TabsUrl` wraps shadcn `Tabs` with a nuqs `useQueryState` backing:

| Prop | Default | Purpose |
|---|---|---|
| `defaultValue` | required | First tab; absent from URL when active (clean URLs) |
| `paramName` | `"tab"` | URL search param key |
| `syncUrl` | `true` | `false` for drawer/dialog tabs (local state only) |

```tsx
<TabsUrl defaultValue="overview">
  <TabsList variant="line">
    <TabsTrigger value="overview">{t('tabOverview')}</TabsTrigger>
    <TabsTrigger value="history">{t('tabHistory')}</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
</TabsUrl>

{/* For drawers/dialogs — local state only: */}
<TabsUrl defaultValue="info" syncUrl={false}>...</TabsUrl>
```

---

*Next: `05-LAYOUT-AND-PROVIDERS.md`.*
