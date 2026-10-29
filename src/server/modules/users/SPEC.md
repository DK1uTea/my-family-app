# Spec: Current user API

**Status: proposed; endpoint is not implemented.** This module owns the signed-in user's
profile and preferences. Authentication and session lifecycle belong to the auth module.

## Objective

Load the authenticated user's profile and preferences from the first-party API so app
bootstrap and `useMe()` do not depend on the external backend.

## Assumptions

- The route is `GET /api/v1/users/me` in the unprefixed Family App API namespace.
- Neon Postgres and Drizzle ORM are selected. Runtime persistence uses Neon serverless driver;
  schemas live under `src/server/drizzle/schema/` and migrations under
  `src/server/drizzle/migrations/`.
- The response must satisfy the current consumers in `useMe()` and `useUserStore`.
- QA owns behavior tests; dev does not create or modify test files.

## Scope and behavior

- A valid access token returns the current user's profile and preferences in the shared
  `{ status, message, error_code, data }` envelope.
- A missing, invalid, or expired access token returns HTTP 401 and never returns protected
  profile data.
- User profile/preferences persistence is accessed through the users repository contract;
  Route Handlers do not contain SQL or user business rules.

## Architecture

- HTTP adapter: `src/app/api/v1/users/me/route.ts`.
- Use case and response mapping: `src/server/modules/users/`.
- Repository contract and data adapter: `src/server/layer-data/users/`.
- Shared Drizzle client configured for Neon: `src/server/third-party/drizzle/client.ts`.
- Preserve the frontend response shape or migrate all consumers in the same approved
  implementation slice.

## Out of scope

Administrative user management, roles/permissions, profile editing, avatar upload,
registration, invites, and preferences endpoints separate from `GET /me`.

## QA coverage

QA authors cases for authenticated profile/preferences, unauthenticated access, and null
or missing relation data. Dev implements against this spec and does not edit test files.

## Open questions

- Which fields are mandatory in the user profile contract after comparing all current
  `useMe()` and store consumers?
- Should profile preferences remain nested in `GET /me` or later get a separate route?
