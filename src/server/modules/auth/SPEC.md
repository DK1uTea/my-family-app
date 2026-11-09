# Spec: Authentication and development seed accounts

**Status: partially implemented.** `src/features/auth/CONTEXT.md` is the compatibility
reference for browser behavior. This backend spec describes the implemented session routes
and development seed accounts; proxy-backed auth integrations are identified below.

## Objective

Own credential verification and signed-in session lifecycle, and provide predictable local
accounts for each built-in role without changing existing account credentials or role
assignments.

## Session API

- `POST /api/auth/login` accepts `{ email, password, rememberMe?, captchaToken }`.
  Valid credentials issue access and refresh cookies. Wrong credentials return
  `WRONG_PASSWORD` with current attempts remaining. Locked accounts return
  `AUTH.LOGIN.ACCOUNT_LOCKED` with lock duration. Status 203 remains successful and signals
  the password-change warning.
- `POST /api/auth/refresh-token` reads the httpOnly refresh cookie, rotates the session, and
  sets new cookies. Invalid, expired, or revoked sessions return 401 and clear token cookies.
- `POST /api/auth/logout` revokes the refresh session when possible and always clears token
  cookies.
- Access tokens are httpOnly for 15 minutes; refresh tokens are httpOnly for seven days.
  Locale and appearance cookies remain readable by the client.
- Routes return the existing `{ status, message, error_code, data }` envelope. Auth route
  files map HTTP methods to controllers; controllers own HTTP and cookie handling, while
  auth services own credential and session use cases.

## Development seed accounts

- `pnpm db:seed` requires `NEON_BRANCH=development` and refuses `NODE_ENV=production`.
- The super admin uses `SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD`. An existing
  email is unchanged unless the operator explicitly passes `--reset-existing`; reset also
  clears failed-attempt and lockout state.
- Ensure at least one user is assigned to each built-in role (`admin`, `adult`, `child`).
  Adult and child fixture emails are `adult.seed@local.test` and `child.seed@local.test`;
  each password is its email prefix followed by `@1234`.
- Create an adult or child user only when that role has no assigned user. Never change an
  existing user's password or role to satisfy the seed. Fail if a fixture email belongs to
  an unrelated account. Re-running without reset is idempotent.
- Newly created seed users receive Vietnamese, light appearance, VND, and `DD/MM/YYYY`
  preferences.

## Architecture

- HTTP adapters live under `src/app/api/auth/`; route files map methods to controllers.
- Use cases live in `src/server/modules/auth/`.
- Auth repository contracts and data adapters live in `src/server/layer-data/auth/`.
- Persistence follows Route Handler -> API controller -> auth service -> repository
  contract -> Drizzle adapter -> shared Drizzle client -> Neon. Services and controllers do
  not query Drizzle directly.
- Runtime DB access uses pooled `DATABASE_URL`; migrations use `DATABASE_URL_UNPOOLED`.
  Keep signing secrets server-only, hash passwords and persisted refresh tokens, and never
  return tokens in JSON or log raw credentials/tokens.

## Boundaries

Invite creation/acceptance, registration, password recovery, SSO, avatar upload, and email
delivery remain proxy integrations or separate work. Roles/permissions belong to
`src/server/modules/roles/`; current-user profile lookup belongs to
`src/server/modules/users/`.

## QA coverage

QA owns cases for login success/failure, lockout and remaining attempts, status-203 warning,
cookie issuance, refresh rotation/rejection, logout revocation, CAPTCHA behavior, seed role
coverage, deterministic fixture credentials, idempotency, collision safety, and explicit
super-admin reset behavior. Seed tests cover pure account-selection/password helpers; DB
integration behavior must be checked against a development database when seed logic changes.
