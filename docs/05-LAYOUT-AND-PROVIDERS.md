# 05 — Layout and Providers

## App Router Layout Tree

```
app/layout.tsx                     Root: <html>, <body>, fonts, ThemeProvider
└── app/[locale]/layout.tsx        Providers: NextIntlClientProvider, ReactQueryProvider, NuqsAdapter, ToastProviders
    ├── (auth)/login/page.tsx      Login page — no app shell
    ├── (private)/layout.tsx       App shell: Sidebar + Header + LocaleSync
    │   ├── dashboard/page.tsx
    │   ├── users/page.tsx
    │   └── …
    └── (public)/page.tsx          Component showcase (dev only)
```

## Provider Stack (locale layout)

```tsx
<NextIntlClientProvider locale messages>
  <ReactQueryProvider>               // TanStack Query client
    <NuqsAdapter>                    // nuqs URL state adapter
      {children}
      <ToastProviders />             // sonner toaster
    </NuqsAdapter>
  </ReactQueryProvider>
</NextIntlClientProvider>
```

## Responsive Strategy

**Mobile-first** with four breakpoints:

| Breakpoint | Tailwind prefix | Viewport |
|---|---|---|
| Base | — | `< 640px` (mobile) |
| Small | `sm:` | `≥ 640px` (large mobile / tablet portrait) |
| Medium | `md:` | `≥ 768px` (tablet landscape) |
| Large | `lg:` | `≥ 1024px` (desktop) |

## Sidebar

Built on the `SidebarProvider` / `Sidebar` component family from `src/shared/components/ui/sidebar.tsx`. Key behaviors:

- State: `expanded` | `collapsed` (toggle via keyboard shortcut `⌘B`)
- Mobile: rendered as a `Sheet` (off-canvas overlay)
- Cookie persistence: `sidebar_state` cookie — survives page refresh
- Styled with `bg-sidebar` / `text-sidebar-foreground` tokens (tenant-branded, same in both themes)

## i18n Routing

`next-intl` uses `localePrefix: 'always'` — every route has an explicit locale segment:

```
/vi/dashboards    ← Vietnamese (default locale)
/en/dashboards    ← English
```

The `createNavigation()` helper exports locale-aware `Link`, `useRouter`, and `usePathname` from `src/i18n/navigation.ts`.

```tsx
// ✅ Always import from @/i18n/navigation
import { Link, useRouter, usePathname } from '@/i18n/navigation';

<Link href="/dashboards">Dashboard</Link>  // renders /vi/dashboards automatically
router.push('/settings');                 // navigates to /vi/settings
const pathname = usePathname();           // /dashboards (no locale prefix)

// ❌ Never import from next/navigation directly
import { useRouter } from 'next/navigation'; // WRONG
```

---

*Next: `06-INTEGRATION.md`.*
