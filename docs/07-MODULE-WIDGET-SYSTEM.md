# 07 — Module / Widget System

## Feature Module Definition

A **feature module** is a self-contained directory under `src/features/<name>/` that owns a single domain:

```
src/features/user-management/
├── (helpers)/
│   └── create-user-schema.ts       Zod schema for create/edit forms
├── (hooks)/
│   ├── use-user-management-data.ts     Query hook — fetcher calls the API directly
│   ├── use-user-management-actions.ts  Mutation hooks — fetcher + invalidation
│   └── use-user-management-filters.ts  nuqs URL state for table filters
└── (components)/
    ├── user-management-main.tsx        Primary view component
    ├── user-management-main-skeleton.tsx
    ├── user-management-table.tsx       Sub-component (< 200 lines rule)
    └── user-management-create-form.tsx
```

Parenthesised folders (`(helpers)`, `(hooks)`, `(components)`) are **path aliases only** — they do not affect Next.js routing. There is usually no `(services)/` folder — a hook's fetcher calls `apiProxy` directly at the top of the hook file; add `(services)/<name>-service.ts` only when the same fetcher is reused by multiple hooks.

## Sub-Feature Nesting

Sub-features use **regular folders** (no parentheses) inside the parent feature:

```
src/features/user-management/
└── user-detail/
    ├── (hooks)/use-user-detail-data.ts
    └── (components)/user-detail-main.tsx
```

## Component Scoping Rules

```
Feature-scoped (default)
  └── src/features/<name>/(components)/
        └── Used within one feature only

Shared (promoted)
  └── src/shared/components/
        └── Used by 3+ features OR by features + layouts

Primitive (shadcn)
  └── src/shared/components/ui/
        └── Never contains business logic
```

## Page Route Wiring

Page files are **thin wrappers** — they import the feature's main component and nothing else:

```tsx
// app/[locale]/(private)/user-management/page.tsx
import { UserManagementMain } from '@/features/user-management/(components)/user-management-main';

export default function UserManagementPage() {
  return <UserManagementMain />;
}
```

Every `page.tsx` requires:
- A sibling `loading.tsx` that renders the feature's main skeleton
- A sibling `error.tsx` using `ErrorPage` from `@/shared/components/common/error-page`

## Widget Composition Pattern

Complex page widgets (e.g. a stat card with a chart and filter header) follow a three-file pattern:

```
user-stats-widget.tsx          ← Orchestrates layout, reads from hook
user-stats-widget-header.tsx   ← Toolbar / title / filter controls
user-stats-widget-skeleton.tsx ← Loading state
```

The orchestrator imports `useUserStatsData()` and passes slices of data down as props. Child components receive only the data they render — no hooks called inside children.

## Skill Reference (`.omc/skills/`)

| Skill | When to use |
|---|---|
| `nextjs-feature` | Scaffold a new feature end-to-end |
| `nextjs-component` | Create a single component or skeleton |
| `nextjs-data` | Set up query/mutation hooks that call the API directly |
| `nextjs-form` | Forms with react-hook-form + zod |
| `nextjs-url` | URL state, filters, pagination, deep linking |
| `nextjs-i18n` | Add or update translation keys |
| `nextjs-colors` | Add or audit color token usage |
| `nextjs-button` | Button variants and sizes |
| `nextjs-tab` | URL-synced tab navigation |

---

*Start over: `00-VISION-AND-CONCEPT.md`.*
