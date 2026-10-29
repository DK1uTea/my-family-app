# Spec: First-party auth API

**Status: proposed; endpoints are not implemented.** This module owns credentials and
session lifecycle. The UI's current auth behavior is documented in
`src/features/auth/CONTEXT.md` and remains the compatibility reference.

## Objective

Move the core signed-in session from the external API to first-party Next.js Route
Handlers while preserving the current browser login, refresh, and logout experience.

## Assumptions

- The first-party namespace is `/api/v1/auth`; there are no `/core` or `/etr` prefixes.
- Neon Postgres and Drizzle ORM are selected. Runtime persistence uses Neon serverless driver;
  schemas live under `src/server/drizzle/schema/` and migrations under
  `src/server/drizzle/migrations/`.
- Auth owns credential verification, login protection, session creation/rotation/revocation,
  and access-token validation.
- Invite registration, password recovery, SSO, avatar storage, and socket auth are later
  work because they need separate delivery/provider decisions.
- Existing CAPTCHA verification remains enabled, including its current development-only
  bypass behavior.
- QA owns behavior tests; dev does not create or modify test files.

## Scope and behavior

- `POST /api/v1/auth/login` accepts `{ email, password, rememberMe?, captchaToken }`.
  Valid credentials issue access and refresh cookies. Invalid credentials return
  `WRONG_PASSWORD` with current attempts remaining. Locked accounts return
  `AUTH.LOGIN.ACCOUNT_LOCKED` and lock duration. A successful login requiring a password
  change preserves the current status-203 warning expected by the login form.
- `POST /api/v1/auth/refresh` reads the httpOnly refresh cookie, rotates the session, and
  sets new cookies. Invalid, expired, or revoked sessions return 401 and clear both token
  cookies.
- `POST /api/v1/auth/logout` revokes the refresh session when possible and always clears
  both token cookies.
- The initial cookie contract is an httpOnly 15-minute access token and httpOnly 7-day
  refresh token. Locale/theme cookies remain non-httpOnly.
- New endpoints use real HTTP status codes and the agreed
  `{ status, message, error_code, data }` response envelope. Frontend interceptors must
  be migrated as part of endpoint rollout.

## Architecture

- Route Handlers stay under `src/app/api/v1/auth/` and only handle HTTP parsing, cookies,
  and response mapping.
- Use cases live in `src/server/modules/auth/`.
- Auth repository contracts and their data adapters live in `src/server/layer-data/auth/`.
- The shared Drizzle client configured for Neon lives in
  `src/server/third-party/drizzle/client.ts`; domain persistence adapters depend on repository
  contracts rather than the provider client.
- Auth persistence follows Route Handler -> auth service -> repository contract -> Drizzle
  repository adapter -> shared Drizzle client -> Neon. Keep Drizzle calls out of routes and
  domain services.

## Environment and security

- Runtime DB access uses pooled `DATABASE_URL`; migration tooling, if selected, uses
  `DATABASE_URL_UNPOOLED`.
- Access-token and refresh-token signing secrets are separate server-only variables.
- Login uses existing `RECAPTCHA_SECRET_KEY`; the site key remains public.
- Keep tokens httpOnly, hash passwords and persisted refresh tokens, and never return
  tokens in JSON or log raw credentials/tokens.
- Local development should use the Neon `development` branch. Do not test auth writes
  against `production`.

## Out of scope

Invite creation/acceptance, registration, forgot/reset password and email delivery, SSO,
avatar upload, socket token, user administration, roles/permissions, and migration of
non-auth endpoints from the external proxy.

## QA coverage

QA authors cases for valid/invalid login, lockout and remaining attempts, status-203
warning, cookie issuance, refresh rotation/rejection, logout revocation, and CAPTCHA
behavior. Dev implements against this spec and does not edit test files.

## Open questions

- Does phase one need a local admin seed/create-user command before invite registration?
- Are the four auth endpoints sufficient for the first migration slice?
