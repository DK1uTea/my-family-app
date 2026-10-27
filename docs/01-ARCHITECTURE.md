# 01 — Architecture

## Layer Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Browser (CSR)                                                               │
│                                                                              │
│  app/[locale]/…/page.tsx          App Router  —  route entry (thin wrapper) │
│              │                                                               │
│              ▼                                                               │
│  features/…/(components)/….tsx    Component   —  renders JSX only           │
│              │                                                               │
│              ▼                                                               │
│  features/…/(hooks)/use-….ts      Hook        —  nuqs state · queryKey ·    │
│                                    fetcher calls the API directly            │
│              │                                                               │
│              ▼                                                               │
│  lib/api-client.ts                Single axios instance + interceptors      │
│                    │                                                        │
│               [apiProxy]                                                   │
└────────────────────┼─────────────────────────────────────────────────────────┘
                     │
        /api/auth/*  or  /api/[...path]
              ┌──────────▼────────┐
              │ Next.js Route     │
              │ Handlers          │
              │ (httpOnly RT +    │
              │  catch-all proxy) │
              └──────────┬────────┘
                         │
              ┌──────────▼────────────────┐
              │         NestJS Backend     │
              │  (internal network only)  │
              │  REST + Swagger/OpenAPI    │
              └────────────────────────────┘
```

## Directory Structure

```
src/
├── app/
│   ├── api/                          # Next.js route handlers — auth cookies + backend proxy
│   │   ├── auth/login/route.ts
│   │   ├── auth/refresh-token/route.ts
│   │   ├── clear-cookies/route.ts
│   │   └── [...path]/route.ts        # Catch-all proxy — forwards any path to core/backend-api
│   ├── [locale]/                     # All UI routes — locale segment is mandatory
│   │   ├── layout.tsx                # NextIntlClientProvider + ReactQueryProvider + NuqsAdapter
│   │   ├── (auth)/login/page.tsx     # Public (unauthenticated) routes
│   │   ├── (private)/                # Authenticated routes + shared app shell
│   │   │   ├── layout.tsx            # LocaleSync: redirects to me.language after login
│   │   │   └── _components/locale-sync.tsx
│   │   └── (public)/                 # Component showcase / design system playground
│   ├── layout.tsx                    # Minimal root: <html>, <body>, fonts, ThemeProvider
│   └── globals.css                   # Tailwind v4 @theme inline + @font-face declarations
├── features/<name>/                  # Feature-based domain modules (see 07-MODULE-WIDGET-SYSTEM.md)
├── i18n/
│   ├── routing.ts                    # defineRouting — locales, defaultLocale, localePrefix
│   ├── request.ts                    # getRequestConfig — maps [locale] segment to messages
│   └── navigation.ts                 # createNavigation — locale-aware Link, useRouter, usePathname
├── lib/
│   ├── api-client.ts                 # apiProxy axios instance + shared interceptors
│   ├── get-error-message.ts          # Maps backend error_code → errors namespace i18n messages
│   ├── query-config.ts               # TanStack Query default options
│   └── utils.ts                      # cn() and misc helpers
├── messages/
│   ├── de.json                       # Default locale (German)
│   └── en.json
├── proxy.ts                          # Auth guards, locale redirects, intl middleware chain
├── shared/
│   ├── components/
│   │   ├── icons/                    # Custom SVG icons — one file per icon, re-exported from index.tsx
│   │   └── ui/                       # shadcn primitives + project-specific wrappers
│   ├── hooks/common/                 # Hooks shared across features
│   ├── providers/                    # ReactQueryProvider, ThemeProvider, ToastProvider
│   ├── constants/                    # App-wide named constants
│   └── stores/                       # Zustand stores
└── styles/themes/                    # Per-tenant CSS token overrides
    ├── _template.css
    └── default.css
```

## Request Lifecycle

```
User action
  → nuqs updates URL (shallow push)
  → queryKey derived from URL params changes
  → TanStack Query detects stale queryKey
  → feature hook's fetcher calls apiProxy directly
  → Axios request interceptor: attaches Bearer AT, x-lang, x-user-identifier
  → request hits /api, forwarded server-side to the internal backend by the
    Next.js route handler (catch-all proxy or dedicated auth handler)
  → Backend responds with { status, message, error_code, data }
  → Axios response interceptor: unwraps envelope, throws on 4xx, resolves error_code
    via getErrorMessage() (errors i18n namespace) and fires toast
  → TanStack Query caches result
  → Component re-renders with fresh data
```

---

*Next: `02-DESIGN-SYSTEM.md`.*
