# 01 â€” Architecture

## Full-stack boundary

This repository is one Next.js application containing the browser UI and first-party
server code. Route Handlers are the API controllers. The existing external API proxy stays
available during migration; new first-party API work is organized under the same Next.js
runtime and does not add a NestJS app.

```text
Browser / React features
        â”‚ same-origin /api requests
        â–¼
Next.js Route Handlers: src/app/api/**/route.ts
        â”‚ call
        â–¼
Server modules: src/server/modules/<domain>
        â”‚ repository interfaces
        â–¼
Layer data: src/server/layer-data/<domain>
        â”‚ Drizzle domain adapter
        â–¼
Shared Drizzle client: src/server/third-party/prisma
        â”‚ Neon driver adapter
        â–¼
Neon Postgres
```

## Directory structure

```text
src/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ api/                       # Route Handlers: HTTP boundary
â”‚   â”‚   â”œâ”€â”€ [...path]/             # Existing external API proxy
â”‚   â”‚   â”œâ”€â”€ auth/                  # Existing auth handlers during migration
â”‚   â”‚   â””â”€â”€ health/database/       # First-party Neon probe
â”‚   â””â”€â”€ [locale]/                  # Locale-aware UI routes
â”œâ”€â”€ features/<name>/               # UI features and CONTEXT.md
â”œâ”€â”€ server/
â”‚   â”œâ”€â”€ SPEC.md                    # Cross-cutting server foundation spec
â”‚   â”œâ”€â”€ modules/
â”‚   â”‚   â”œâ”€â”€ auth/SPEC.md            # Auth endpoint and behavior contract
â”‚   â”‚   â””â”€â”€ users/SPEC.md           # User endpoint and behavior contract
â”‚   â”œâ”€â”€ layer-data/                # Repository contracts and implementations
â”‚   â”œâ”€â”€ third-party/neon/           # Neon provider integration
â”‚   â”œâ”€â”€ third-party/prisma/         # Shared Drizzle Client with Neon adapter
â”‚   â”œâ”€â”€ openapi/                    # OpenAPI source document
â”‚   â”œâ”€â”€ core/                      # Shared server primitives
â”‚   â””â”€â”€ config/                    # Validated server environment
â”œâ”€â”€ i18n/                          # Locale routing and navigation
â”œâ”€â”€ lib/                           # Shared frontend utilities/API client
â””â”€â”€ shared/                        # UI primitives, providers and app-wide state
```

## Backend module boundaries

Tenant management lives in `src/server/modules/tenants/` and its persistence adapter in
`src/server/layer-data/tenants/`. Authenticated actors carry DB-verified `roleKey` and
`tenantId`; every tenant-owned repository operation must enforce that scope.

- A Route Handler owns transport concerns: input parsing, HTTP status, headers, and
  cookies. It delegates business decisions to a server module.
- A server module owns one domain's use cases and its `SPEC.md`. Keep auth and user
  contracts separate even when an implementation flow touches both.
- `layer-data/<domain>` owns that domain's repository interfaces and provider-specific
  repository adapters. Modules depend on repository interfaces.
- `third-party` owns shared clients and external SDK integration. It must not become a
  second location for domain rules or repository behavior.
- Mark server modules with `server-only`; client components cannot import them.
- Use ordinary TypeScript exports/factories for composition. This is a Nest-inspired
  organization, not NestJS: no decorators, Nest modules, DI runtime, or separate server.

## Database and environment branches

Neon Postgres is the selected cloud database and Drizzle ORM is the selected persistence
layer. Runtime Drizzle queries use Drizzle's Neon driver adapter and pooled `DATABASE_URL`;
Drizzle migrations use the direct `DATABASE_URL_UNPOOLED` connection. Drizzle config,
schema, per-domain models and migrations are grouped under `src/server/prisma/`.

For first-party requests, keep the reference backend's responsibilities without adding
Nest: Route Handler -> domain module service -> repository contract -> Drizzle repository
adapter -> shared Drizzle client -> Neon. Route Handlers act as controllers; TypeScript
factories compose dependencies. Routes and services do not access Drizzle directly.

Swagger UI is available at `/api/docs` and its OpenAPI JSON at `/api/openapi.json`.
Production serves neither unless `API_DOCS_ENABLED=true`.

Neon has separate `production` and `development` branches; production remains the default
branch. `.neon` chooses the CLI context, while the actual app connection is controlled by
`DATABASE_URL` in `.env.local`. The default `neon checkout <branch>` changes the context
and refreshes Neon environment variables. `--no-env-pull` changes only the CLI context,
so the running app keeps using its previous URL. Restart the app after a normal checkout.

The development branch was created from a production snapshot. Its initial contents may
match production, but writes after the branch point are isolated. Check `neon status`
before `neon deploy`; deploy applies the current `neon.ts` policy to the selected branch.

## Migration state

Existing frontend auth flows and external API proxy handlers remain operational while
features migrate. The first-party database health route verifies connectivity but does
not define an application schema. Implement future endpoint work against the specs in
`src/server/modules/<domain>/SPEC.md`; keep frontend feature specs in `docs/specs/`.
