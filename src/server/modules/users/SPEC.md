# Spec: Current user API

**Status: implemented at `GET /api/users/me`.** This module owns the signed-in user's
profile and preferences. Authentication and session lifecycle belong to the auth module.

## Objective

Load the authenticated user's profile and preferences from the first-party API so app
bootstrap and `useMe()` do not depend on the external backend.

## Assumptions

- The route is `GET /api/users/me` in the current Family App API namespace.
- Neon Postgres and Drizzle ORM are selected. Runtime persistence uses Neon serverless driver;
  schemas live under `src/server/drizzle/schema/` and migrations under
  `src/server/drizzle/migrations/`.
- The response must satisfy the current consumers in `useMe()` and `useUserStore`.
- QA owns behavior tests; dev does not create or modify test files.

## Scope and behavior

- A valid access token returns the current user's profile and preferences in the shared
  `{ status, message, error_code, data }` envelope.
- `data.role.navbar` is derived from persisted role permissions. It contains module keys
  for which the role has read permission, or `["*"]` for wildcard admin. Dashboard and
  Settings are always visible in the frontend and do not appear in this list.
- `data.role.permissions` contains the role's granted action permission keys. User-level
  legacy permission and navbar columns are not used to grant access and are retained only
  during migration.
- A missing/invalid role yields empty permission and navbar lists, never admin access.
- The default currency for new preferences and missing preference records is `VND`.
  A data migration changes every existing `user_preferences.currency` value to `VND`;
  it does not convert any business amounts. New users receive no role until an admin
  assigns one; the seed explicitly assigns `admin`.
- A missing, invalid, or expired access token returns HTTP 401 and never returns protected
  profile data.
- User profile/preferences persistence is accessed through the users repository contract;
  Route Handlers do not contain SQL or user business rules.

## Architecture

- HTTP method and authentication policy: `src/app/api/users/me/route.ts`.
- HTTP controller: `src/app/api/users/users.controller.ts`.
- Use case and response mapping: `src/server/modules/users/`.
- Repository contract and data adapter: `src/server/layer-data/users/`.
- Shared Drizzle client configured for Neon: `src/server/third-party/drizzle/client.ts`.
- Preserve the frontend response shape or migrate all consumers in the same approved
  implementation slice.

## Out of scope

Administrative user management, role CRUD (owned by `roles`), profile editing, avatar upload,
registration, invites, and preferences endpoints separate from `GET /me`.

## QA coverage

QA authors cases for authenticated profile/preferences, unauthenticated access, null or
missing relation data, and the `VND` fallback when preferences are absent. The historical
currency backfill is verified against the development database after migration by checking
that no `user_preferences` row has a currency other than `VND`; this data-only migration
does not have a meaningful isolated unit test in the current Vitest setup. Dev implements
against this spec and does not edit test files.
