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
- OpenAPI contracts live in `src/server/openapi/contracts.ts`; the generated document is
  served as `/api/openapi.json` and rendered with Swagger UI at `/api/docs`.
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

## Database change workflow

Drizzle schema files and committed SQL migrations are the database change history. Do not
change a shared database with an unrecorded SQL edit or use `db:push` for production.

```powershell
# 1. Edit src/server/drizzle/schema/.
# 2. Generate a migration from the schema diff.
pnpm db:generate -- --name add_user_preferences

# 3. Review the generated SQL and snapshots under src/server/drizzle/migrations/.
# 4. Apply pending migrations to the database selected by .env.local.
pnpm db:migrate

# 5. Check migration history consistency.
pnpm db:check
```

Commit schema changes, SQL, snapshots, and `_journal.json` together. A developer who pulls
a migration runs `pnpm db:migrate` against their own configured development database; pulling
code does not mutate a database automatically. `db:check` checks migration history. CI also
runs `db:generate` and fails if that produces uncommitted changes under the migrations
folder, which catches schema changes without a committed migration.

New migrations use `YYYYMMDDHHmmss_<name>.sql`; the timestamp is generated in UTC by
Drizzle's `timestamp` migration prefix. Always supply a descriptive name with
`pnpm db:generate -- --name <short_snake_case_name>`, for example
`20261101123000_add_user_preferences.sql`. Historical `0000_...` files keep their
original names and must not be renamed. The timestamp makes the generation date/time
visible; `_journal.json` remains the migration execution order.

### Local super admin

`pnpm db:seed` creates a local super admin in the database selected by `.env.local`. First
apply migrations, verify `neon status` shows the development branch, and set
`NEON_BRANCH=development` plus these values in the ignored `.env.local` file:

```dotenv
SEED_SUPER_ADMIN_EMAIL=you@example.com
SEED_SUPER_ADMIN_PASSWORD=<a unique password of at least 12 characters>
SEED_SUPER_ADMIN_FIRST_NAME=Super
SEED_SUPER_ADMIN_LAST_NAME=Admin
```

Then run:

```powershell
pnpm db:seed
```

The command creates a `role_key=admin` user with the wildcard `*` permission and Vietnamese
preferences. It does not log the password, does not overwrite an existing email, and refuses
to run when `NODE_ENV=production`. If the email already exists, use a new email; the seed is
not a password reset tool. Sign in through `/vi/login` using the configured email/password.
The login page also needs its reCAPTCHA site key/secret configured; local development may
explicitly set `SKIP_CAPTCHA_VERIFICATION=true` in `.env.local` (the bypass is disabled in
production). Never commit real seed credentials or run this against the production branch.

The repository currently has validation CI but no deployment workflow. A deployment system
must run `pnpm db:migrate` once, serially, before rolling out the new app version, using
`DATABASE_URL_UNPOOLED` (direct Neon connection). Do not put migration execution in the app
startup path or run it independently in each replica. A failed migration must stop rollout;
recover with a reviewed forward migration. Never automatically drop or reset a schema.

Test a migration on the Neon development branch with production-like data before applying it
to production. Confirm the active branch with `neon status`; use the normal development
checkout and restart the app before local migration work. Do not run `db:migrate` until the
target database has been verified.

## API contract and Swagger workflow

First-party API contracts live in `src/server/openapi/contracts.ts`. Each operation records
its method, path, request/response Zod schemas, summary, and response descriptions. The
OpenAPI generator checks that every non-proxy API Route Handler method has a matching
contract and writes `src/server/openapi/generated.json`; `/api/openapi.json` serves that
generated document and `/api/docs` renders it.

When adding or changing an API:

1. Implement/update the Route Handler and its domain behavior.
2. Add or update the matching operation in `src/server/openapi/contracts.ts`. Use the same
   Zod schemas as runtime request/response validation where applicable; do not guess opaque
   upstream payloads.
3. Generate and validate the document:

   ```powershell
   pnpm openapi:generate
   pnpm openapi:check
   ```

4. Review and commit the contract and generated JSON with the API change. Verify the
   operation appears at `/api/openapi.json` and `/api/docs`.

CI runs `pnpm openapi:check`, which checks route/contract coverage and fails when the
generated document is stale. The external `[...path]` proxy is deliberately excluded: its
upstream contract is not owned by this app. Production docs remain disabled unless
`API_DOCS_ENABLED=true`.

## Specs

- Cross-cutting server foundation: `src/server/SPEC.md`.
- Domain requirements: `src/server/modules/<domain>/SPEC.md`.
- UI and frontend feature specs: `docs/specs/`.
