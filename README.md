# My Family App

Full-stack family app built with Next.js App Router. The repository contains both the UI
and its first-party server code; Next.js Route Handlers are the HTTP boundary. There is no
separate NestJS application.

## Start locally

```bash
pnpm install
pnpm dev
```

The app runs at http://localhost:3000. Copy `.env.example` to `.env.local` when setting up
the frontend and external API. `NEXT_PUBLIC_API_BASE_URL` is the backend origin only
(for example `http://localhost:3001`); the app appends `/api/v1` and does not add a
`/core` service prefix. Neon CLI can populate the Neon connection variables in
`.env.local` after login and project setup. Keep that file private and never commit it.

## Server architecture

- `src/app/api/` contains Next.js Route Handlers. Keep them thin: parse HTTP input, call a
  server module, then serialize the response.
- `src/server/modules/<domain>/` contains domain use cases and its `SPEC.md`.
- `src/server/layer-data/<domain>/` contains repository contracts and concrete data
  adapters for that domain.
- `src/server/third-party/` contains shared integrations, including the Prisma client with
  Neon's driver adapter.
- `src/server/core/` and `src/server/config/` contain shared server primitives and
  validated environment access.

See [server architecture](src/server/README.md) and [architecture overview](docs/01-ARCHITECTURE.md).

## Neon development and production

The Neon project keeps `production` as its default branch; local development uses the
separate `development` branch. Check the active CLI branch with `neon status` and list
branches with `neon branches list --project-id calm-voice-34721495`.

```powershell
# Switch the CLI context and refresh Neon variables in .env.local
neon checkout development

# Optional: create a separate persistent QA branch, then switch the app to it
neon branches create --project-id calm-voice-34721495 --name qa --parent development --no-secrets
neon checkout qa

# Switch CLI context only; this does NOT change the app's current DB URL
neon checkout development --no-env-pull
```

By default `neon checkout <branch>` also refreshes `DATABASE_URL`,
`DATABASE_URL_UNPOOLED`, and `NEON_BRANCH` in `.env.local`. Restart the app after changing
those variables. Confirm `neon status` before running `neon deploy`; it applies
`neon.ts` to the currently selected branch. The dev branch starts from a production
snapshot, so its initial contents may include production data; subsequent writes are
isolated to the selected branch.

Do not use `neon checkout production` while testing app writes. A normal checkout refreshes
`.env.local`; use `--no-env-pull` only when you intentionally want to leave the app on its
current URL while changing CLI context.

Runtime queries use the pooled `DATABASE_URL`. Prisma ORM is selected; use Prisma's Neon
driver adapter for runtime connections and `DATABASE_URL_UNPOOLED` for direct migration
connections. Prisma config, schema, models and migrations are grouped under
`src/server/prisma/`. Add models to `src/server/prisma/models/<domain>.prisma`.

Interactive API docs are at `/api/docs`; the OpenAPI JSON is at `/api/openapi.json`.
They are enabled by default locally and disabled in production unless
`API_DOCS_ENABLED=true` is set.

```bash
pnpm db:validate
pnpm db:generate
pnpm db:migrate:dev
pnpm db:studio
```

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

See `docs/` for UI architecture and guidance. Backend/domain specs live alongside their
server modules; see [spec locations](docs/specs/README.md).
