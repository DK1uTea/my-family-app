# Server architecture

This is server-side application code inside the existing Next.js app, not a second
NestJS service. Next.js App Router Route Handlers under `src/app/api/` own HTTP methods,
headers, cookies, status codes, and response serialization. They delegate domain work to
the server modules.

```text
src/
├── app/api/                       # Next.js HTTP boundary
│   ├── [...path]/route.ts         # Existing external API proxy
│   └── health/database/route.ts   # First-party Neon connectivity probe
└── server/                        # Server-only application code
    ├── modules/
    │   ├── auth/                  # Auth use cases + SPEC.md
    │   └── users/                 # User use cases + SPEC.md
    ├── drizzle/                   # Drizzle schema and migrations
    ├── layer-data/
    │   ├── auth/                  # Auth repository contracts/adapters
    │   └── users/                 # User repository contracts/adapters
    ├── third-party/
    │   ├── neon/                  # Neon provider integration
    │   └── drizzle/               # Shared Drizzle client using Neon adapter
    ├── core/                      # Shared errors, response and auth primitives
    └── config/                    # Validated server environment access
```

## Dependency direction

- `app/api` is an adapter: validate and parse the request, invoke a module, map its result
  to an HTTP response. Do not put domain decisions or SQL in a route handler.
- `modules/<domain>` owns use cases and domain behavior. Its `SPEC.md` is the source of
  truth for the module's endpoint contract and requirements.
- `layer-data/<domain>` owns repository interfaces and their implementations. A module
  depends on the interface, not on a Neon SDK.
- `third-party` owns the shared Drizzle client configured with Neon driver;
  domain-specific Drizzle repository adapters belong in `layer-data/<domain>`.
- Request flow is Route Handler -> module service/use case -> repository contract -> Drizzle
  repository adapter -> shared Drizzle client -> Neon. Routes and services do not query Drizzle.
- `core` and `config` hold cross-domain primitives and validated environment values.
- Server modules import `server-only`; client components must not import `src/server/`.

Compose modules and adapters with ordinary TypeScript exports or factories. Next.js does
not need Nest decorators, modules, a DI container, or a second runtime.

## Current state and decisions

- `auth` and `users` have typed repository contracts and module boundaries. Their
  behavior is specified but the first-party auth endpoints are not implemented yet.
- Neon Postgres is the selected cloud database. `DATABASE_URL` is pooled for runtime;
  `DATABASE_URL_UNPOOLED` is reserved for direct connections such as migrations.
- Drizzle ORM is selected, with Neon serverless driver for runtime database access.
  The shared client is `src/server/third-party/drizzle/client.ts`; the database health
  probe uses it to verify connectivity. Schemas belong in
  `src/server/drizzle/schema/`.
- OpenAPI is defined in `src/server/openapi/spec.ts`, served as `/api/openapi.json` and
  rendered with Swagger UI at `/api/docs`.
- Existing auth handlers and the catch-all external API proxy remain in place until the
  first-party endpoint migration is implemented module by module.

## Neon branch safety

The local Neon context is in the ignored `.neon` file. The app's database target is the
connection URL in ignored `.env.local`:

```powershell
neon status
neon checkout development       # also refreshes Neon variables in .env.local
neon checkout production --no-env-pull  # context only; app URL does not change
```

Use the normal checkout when the app should connect to that branch, then restart the app.
`--no-env-pull` leaves the current app URL untouched. Before `neon deploy`, verify the
active branch with `neon status`; deploy applies the `neon.ts` policy to that branch.
`development` was created from a production snapshot, so its initial data may match
production. Writes after the branch point are isolated.

## Specs

- Cross-cutting server foundation: `src/server/SPEC.md`.
- Domain requirements: `src/server/modules/<domain>/SPEC.md`.
- UI and frontend feature specs: `docs/specs/`.
