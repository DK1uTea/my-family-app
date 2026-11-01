# i18n Rules

All static text goes through `useTranslations()` from next-intl. Locale is in the URL prefix (`/vi/dashboards`, `/en/settings`). Default locale: `vi`.

## Routing Structure

```
src/app/[locale]/
├── layout.tsx           # NextIntlClientProvider + ReactQuery + NuqsAdapter
├── (auth)/login/
└── (private)/
    ├── layout.tsx        # LocaleSync: redirects to user's preferred locale
    └── _components/locale-sync.tsx
```

## Navigation — always from @/i18n/navigation

```tsx
import { Link, useRouter, usePathname, redirect } from '@/i18n/navigation';

<Link href="/dashboards">Dashboard</Link>  // renders /vi/dashboards automatically
router.push('/settings');                 // navigates to /vi/settings
const pathname = usePathname();           // returns /dashboards (no locale prefix)
```

Never import from `next/navigation` directly.

## Workflow

1. Identify all static strings
2. Choose namespace (feature name in camelCase: `userManagement`, or `common`)
3. Add keys to `src/messages/en.json`
4. Add same keys to `src/messages/vi.json` with Vietnamese translations
5. Use `useTranslations('namespace')` in the component

```tsx
// Server Component:
import { useTranslations } from 'next-intl';
export default function Page() {
  const t = useTranslations('userManagement');
  return <h1>{t('title')}</h1>;
}

// Client Component:
'use client';
import { useTranslations } from 'next-intl';
export function UserList() {
  const t = useTranslations('userManagement');
  return <Button>{t('createButton')}</Button>;
}
```

## Locale Sync — Redirect to User's Preferred Locale

`useMe()` (`src/features/auth/(hooks)/use-me.ts`) fetches `/user/me` directly via `apiProxy` and applies the user's preferred language on load:

```tsx
async function fetchMe(): Promise<MeData> {
  const response = await apiProxy.get('/user/me');
  return response.data.data as MeData;
}

export function useMe() {
  const query = useQuery({ queryKey: ['me'], queryFn: fetchMe });
  useEffect(() => {
    if (query.data?.settings.preferredLanguage) {
      setLocale(query.data.settings.preferredLanguage);
    }
  }, [query.data]);
  return query;
}
```

## Key Naming Convention

```
featureName.title              → Page/section heading
featureName.createButton       → Primary action button
featureName.empty              → Empty state message
featureName.table.columnName   → Table column headers
featureName.validation.field   → Form validation errors
featureName.detail.tab<Name>   → Tab labels
```

## Rules

- No hardcoded strings — every visible string through `t()`
- Always update both `en.json` and `vi.json`
- Namespace = feature name in camelCase
- `usePathname()` returns path without locale (`/dashboards`, not `/vi/dashboards`)
- `useRouter().push('/path')` auto-adds locale — never manually prefix `/vi/`
- Never import `useRouter` from `next/navigation` — use `@/i18n/navigation`
