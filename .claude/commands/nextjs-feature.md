# Feature Scaffolding

Scaffold a complete feature folder following the project's feature-based architecture.

## Folder Structure

```
src/features/feature-name/
├── (helpers)/feature-name-schema.ts     # Only if has forms
├── (services)/feature-name-service.ts
├── (hooks)/use-feature-name-data.ts     # Types defined here
├── (hooks)/use-feature-name-actions.ts
├── (hooks)/use-feature-name-filters.ts  # Only if has filters/pagination
├── (components)/feature-name-main.tsx
└── (components)/feature-name-main-skeleton.tsx
```

Sub-features: nested regular folders inside the feature folder (no parentheses).

## Page Route Files

```
src/app/[locale]/(route-group)/feature-name/page.tsx
src/app/[locale]/(route-group)/feature-name/loading.tsx   ← always required
src/app/[locale]/(route-group)/feature-name/error.tsx     ← always required
```

## Key Templates

### page.tsx
```tsx
import { FeatureMain } from '@/features/feature-name/(components)/feature-name-main';
export default function FeatureNamePage() {
  return <FeatureMain />;
}
```

### loading.tsx
```tsx
import { FeatureNameMainSkeleton } from '@/features/feature-name/(components)/feature-name-main-skeleton';
export default function FeatureNameLoading() {
  return <FeatureNameMainSkeleton />;
}
```

### error.tsx
```tsx
'use client';
import { ErrorPage } from '@/shared/components/common/error-page';

export default function Error({ error }: { error: Error }) {
  return <ErrorPage error={error} />;
}
```

### (components)/feature-name-main.tsx
```tsx
'use client';
import { useTranslations } from 'next-intl';
import { useFeatureNameData } from '../(hooks)/use-feature-name-data';
import { FeatureNameMainSkeleton } from './feature-name-main-skeleton';

export function FeatureNameMain() {
  const t = useTranslations('featureName');
  const { data, isPending } = useFeatureNameData();

  if (isPending) return <FeatureNameMainSkeleton />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
    </div>
  );
}
```

## Checklist Before Finishing

- All imports use `@/*` aliases
- `Link`/`useRouter`/`usePathname` from `@/i18n/navigation`
- No `forwardRef`, `useMemo`, `useCallback`, `memo`
- `'use client'` on all hook-using components
- Skeleton exists for every data-fetching component
- `loading.tsx` exists alongside every `page.tsx`
- `error.tsx` exists alongside every `page.tsx` — only passes `error` prop, never `reset`
- All static text uses `useTranslations()`
- i18n keys added to both `en.json` and `vi.json`
- Max 200 lines per file; 1 component per file
