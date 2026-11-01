# Spec: Next.js server foundation

**Status: foundation established.** This spec records the cross-cutting architecture and
the decisions that future domain modules must follow.

## Objective

Organize first-party server code inside the existing Next.js app with clear boundaries
between HTTP handlers, domain use cases, persistence contracts, and external providers.

## Scope

- Next.js Route Handlers under `src/app/api/` are the HTTP boundary.
- Server modules live under `src/server/modules/<domain>/`.
- Domain repository contracts and their implementations live under
  `src/server/layer-data/<domain>/`.
- Shared clients and provider SDK integrations live under `src/server/third-party/`.
- Shared server primitives and validated environment access live under `core/` and
  `config/`.
- Server modules are marked with `server-only` and are never imported by client code.

## Decisions

- Keep the app and API in one Next.js repository/runtime. Do not add a second NestJS app,
  Nest decorators, or a Nest dependency-injection runtime.
- Compose modules with ordinary TypeScript exports or factories.
- Neon Postgres is the cloud database. Runtime uses the pooled `DATABASE_URL`; direct
  connections such as migrations use `DATABASE_URL_UNPOOLED`.
- Drizzle ORM is selected for domain persistence, using Neon serverless driver for
  runtime queries. Drizzle schemas live under `src/server/drizzle/schema/` and migrations under
  `src/server/drizzle/migrations/`; use pooled
  `DATABASE_URL` at runtime and `DATABASE_URL_UNPOOLED` for direct migration connections.
- API operations are documented in `src/server/openapi/contracts.ts` from Zod request and
  response schemas. `pnpm openapi:generate` writes the OpenAPI document consumed by
  `/api/openapi.json` and `/api/docs`; `pnpm openapi:check` checks route coverage and drift.
  The external catch-all proxy is excluded because its upstream contract is not owned here.
  In production both docs endpoints are disabled unless `API_DOCS_ENABLED=true`.
- Keep the existing auth routes and external API catch-all working until their migration
  is separately implemented and verified.
- Keep each backend domain's API and behavior spec beside its module in
  `src/server/modules/<domain>/SPEC.md`.

## Current structure

```text
src/app/api/                       # HTTP adapters
src/server/modules/auth/           # Auth use cases and SPEC.md
src/server/modules/users/          # User use cases and SPEC.md
src/server/layer-data/auth/        # Auth repository contract
src/server/layer-data/users/       # User repository contract
src/server/third-party/neon/       # Neon connection
src/server/third-party/drizzle/    # Shared Drizzle client configured for Neon
src/server/openapi/                # OpenAPI document source
src/server/layer-data/<domain>/    # Repository contract and Drizzle adapter
src/server/drizzle/schema/         # Drizzle schema definitions
src/server/drizzle/migrations/     # Generated database migrations
```

## Boundaries

- A request flows Route Handler (HTTP parsing/cookies/response) -> domain module service
  (use case/orchestration) -> layer-data repository contract -> Drizzle repository adapter
  -> shared Drizzle client -> Neon Postgres. Routes and services must not query Drizzle.
- Always keep HTTP serialization in Route Handlers and business rules in server modules.
- Always keep secrets server-side and outside version control.
- Ask before changing existing auth behavior, cookie semantics, or endpoint contracts.
- Every first-party Route Handler method must have an API contract. Update its Zod schemas,
  contract metadata, and generated OpenAPI artifact in the same change.
- Schema changes require a reviewed Drizzle migration committed with the schema. Developers
  apply it locally with `pnpm db:migrate`; CI checks migration consistency and schema drift.
  Deployment must apply migrations once, serially, before app rollout using the direct URL.
- Never import server-only code into client components or put SQL in route handlers.
- Do not add NestJS runtime/decorators. Compose dependencies with TypeScript factories,
  preserving the controller/service/repository/data-provider responsibilities.

## Setup commands

- `pnpm db:generate -- --name <short_snake_case_name>` generates timestamped SQL migrations
  from Drizzle schemas. New filenames use `YYYYMMDDHHmmss_<name>.sql` in UTC; preserve old
  migration filenames and keep SQL, snapshots, and `_journal.json` in the same commit.
- `pnpm db:migrate` applies migrations using direct URL.
- `pnpm db:check` validates Drizzle migration history consistency.
- `pnpm db:seed` creates a local super admin from explicit credentials in `.env.local`;
  it requires `NEON_BRANCH=development`, never uses a committed/default password, and is
  disabled under `NODE_ENV=production`.
- `pnpm db:push` pushes schema changes directly to the database during prototyping.
- `pnpm db:studio` opens Drizzle Studio.
- `pnpm openapi:generate` updates the generated API document.
- `pnpm openapi:check` verifies route coverage and generated-document consistency.
