# 06 — Integration

## API boundary in this full-stack app

The browser always calls same-origin Next.js API routes. A route can either proxy an
existing external API endpoint or call a first-party server module. There is no separate
NestJS application.

```text
Feature hook / TanStack Query
          │ same-origin request through apiProxy
          ▼
Next.js Route Handler (`src/app/api/**/route.ts`)
          ├── existing endpoint → external API catch-all proxy
          └── first-party endpoint → `src/server/modules/<domain>`
                                      │ repository contract
                                      ▼
                            `src/server/layer-data/<domain>` Prisma adapter
                                      │ shared Prisma client
                                      ▼
                            Prisma Neon adapter -> Neon Postgres
```

The request path follows the controller/service/repository/data-provider responsibility
split used by the reference backend: Route Handler handles HTTP, the module service owns
the use case, the repository adapter implements persistence, and the shared Prisma client
connects to Neon. Compose these with TypeScript factories; this does not add NestJS.

### Current and planned routes

- Existing feature API calls continue through `src/app/api/[...path]/route.ts` to the
  configured external backend at `<NEXT_PUBLIC_API_BASE_URL>/api/v1/...`; no service
  prefix such as `/core` is inserted.
- Existing `/api/auth/*` handlers and cookie behavior remain active during migration.
- `/api/health/database` is a first-party connectivity probe only; it does not implement
  application data operations. It verifies connectivity through the configured Prisma
  client and Neon adapter.
- `/api/docs` renders Swagger UI from `/api/openapi.json`; the OpenAPI source is
  `src/server/openapi/spec.ts`. Add operations there as first-party routes are implemented.
- Proposed first-party auth and user endpoints are specified beside their modules in
  `src/server/modules/auth/SPEC.md` and `src/server/modules/users/SPEC.md`. They are not
  implemented yet.

## Frontend API rules

- Define a fetcher inline at the top of the hook file; extract a service only when multiple
  hooks reuse it.
- No try/catch in the fetcher; the API client's response interceptor handles global error
  toasts.
- Existing external-backend responses use `{ status, message, error_code, data }`.
- `getErrorMessage(error_code)` resolves translated strings from the `errors` namespace
  in `src/messages/en.json` and `vi.json`.
- New `error_code` values require matching translation keys in both locale files.
- A first-party route must follow its module spec and use real HTTP status codes; do not
  assume legacy HTTP-200 envelope behavior unless that endpoint is still proxied.

## TanStack Query and URL state

- Existing data fetching is CSR through TanStack Query and `apiProxy`.
- Default query behavior is configured in `src/lib/query-config.ts`.
- Invalidate cache with `queryClient.invalidateQueries()` after mutations.
- Include URL filter state in query keys so nuqs changes select the correct cached result.

```text
nuqs setFilters(...)
  → URL changes
  → queryKey changes
  → TanStack Query reads cache or fetches
  → hook fetcher → apiProxy → same-origin Next.js route
  → external proxy or first-party server module
  → component renders result
```

## Forms, state, and dates

| Layer | Location | Responsibility |
|---|---|---|
| Zod schema | `(helpers)/<feature>-schema.ts` | Validation rules and TypeScript types |
| Form hook | `(hooks)/use-<name>-form.ts` | `useForm`, resolver, submit and mutation |
| Component | `(components)/<name>-form.tsx` | Accessible field rendering |
| Child fields | `useFormContext()` | Decomposed or multi-step forms |

Validation messages use i18n keys. Zustand stores application-wide state that belongs
neither in the URL nor the server cache.

Database timestamps are stored as UTC+0 values representing Germany local time. Use
`formatDate`, `nowUtc`, and `toApiDate` from `src/lib/date-utils.ts`; do not use bare
`Date`, `dayjs`, or `.toISOString()` for application dates.
