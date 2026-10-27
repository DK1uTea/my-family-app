# Component Patterns

Create React components following the project's conventions: feature-scoped, skeleton loading, responsive, dark-mode safe, i18n translated.

## Workflow

1. Create the component in `src/features/<feature>/(components)/component-name.tsx`
2. Create matching skeleton `component-name-skeleton.tsx` using shadcn `Skeleton`
3. Apply responsive layout — mobile-first: base → `sm:` → `md:` → `lg:`
4. Use only semantic color tokens — never hardcoded colors
5. Translate all static text — `useTranslations()` from `next-intl`
6. Check line count — if > 200 lines, extract sub-components or move logic to hooks
7. Evaluate reusability — feature-scoped by default; move to `src/shared/components/` only if used in 3+ features

## Key Rules

- Kebab-case file names: `event-card.tsx`, `user-list-skeleton.tsx`
- `'use client'` required when using hooks, event handlers, or browser APIs
- No business logic in components — delegate to custom hooks
- No `forwardRef`, `useMemo`, `useCallback`, `memo`
- Max 200 lines per file; 1 component per file
- No `(types)/` folder — prop types inline at top of component file
- Mock data in hooks, never in component files
- Skeletons always use `<Skeleton>` from `@/shared/components/ui/skeleton` — never a bare `<div>` with hand-rolled `animate-pulse`/`bg-muted` CSS

## Semantic Color Tokens

Use: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `bg-muted`, `border-border`, `bg-destructive`
Never: `bg-white`, `text-black`, `text-gray-500` or any hardcoded color.

## Skeleton Template

Always build placeholders out of `<Skeleton>` — including inline loading rows inside tables/lists, not just dedicated `*-skeleton.tsx` files. Never write `<div className="h-4 rounded bg-muted animate-pulse" />` by hand.

```tsx
import { Skeleton } from '@/shared/components/ui/skeleton';

export function FeatureListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

```tsx
// ✅ Loading row inside a table — still uses <Skeleton>, not a raw div
<TableCell><Skeleton className="h-4 w-full" /></TableCell>

// ❌ Never
<TableCell><div className="h-4 rounded bg-muted animate-pulse" /></TableCell>
```

## Custom Icons

Add custom SVGs to `src/shared/components/icons.tsx` — never inline raw `<svg>` in feature components.

```tsx
import { IconSignal } from '@/shared/components/icons';
<IconSignal className="size-4" />
```

Every component that fetches data **must** have a sibling `*-skeleton.tsx`, built from `<Skeleton>` — not a custom `<div className="animate-pulse ...">`.
