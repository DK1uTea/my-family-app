# Technical Plan: Multi-tenant foundation and Tenant Management

## Status

Approved for implementation. Use tenant ID `default` / name `Default Tenant`; assign
existing users there during backfill, then make the configured seed super admin tenantless.
Tenant-aware invite provisioning remains a follow-up; local APIs reject accounts without a
valid local tenant membership.

## 1. Components and dependencies

1. **Data ownership inventory (completed)** — the local Drizzle schema contains users,
   roles, preferences, and refresh tokens. Event Timeline is a placeholder with no API.
   Current upstream calls are invite/registration, password recovery, avatar upload, and a
   middleware preference lookup; there are no current feature data queries to tenant-scope.
   Future tenant-owned business APIs must enforce scope in their owning service/repository.
2. **Tenant persistence** — add `tenants` schema/repository/service, tenant foreign keys,
   indexes, and a reviewed Drizzle migration. Existing records need an explicit initial
   tenant assignment before constraints become non-null.
3. **Authentication and actor scope** — add `super_admin`, tenant membership, and active
   tenant state to auth records and verified actor context. Login/refresh load current DB
   state. Auth policy rejects inactive tenants and keeps `super_admin` separate from
   tenant-scoped `admin`.
4. **Tenant API** — add first-party routes/controllers/contracts for paginated search,
   create, rename, and active-state changes. Route policy requires `super_admin`; service
   validates input; repository owns persistence.
5. **Roles, `/me`, and permissions** — remove admin wildcard-as-platform behavior, reserve
   platform scope for `super_admin`, scope role/user administration to tenant, derive the
   tenant-management navbar key and permissions, and include nullable tenant summary in
   `/api/users/me`.
6. **Development seed** — create the configured initial tenant and ensure a super admin
   plus tenant `admin`, `adult`, and `child` accounts, idempotently and only on development.
7. **Tenant Management UI** — add a permission-gated sidebar module with search, table,
   pagination, create/edit dialogs, and active/deactive row actions, using existing shared
   components and both locales.

## 2. Implementation order and checkpoints

### Phase A — Confirm rollout inputs (defaults approved)

- Confirm invite acceptance provisions users in the upstream identity service, local Neon,
  or both; define how invitation metadata binds a new user to a tenant. This is the only
  known upstream dependency that may affect tenant membership.
- Confirm which existing local users should become the platform super admin and which
  should be backfilled into the initial tenant. Current database contents must be inspected
  on a verified development branch before migration generation/application.
- Keep initial tenant ID/name as `default` / `Default Tenant`; use env values for all seed
  credentials. Existing access tokens without tenant claims are rejected; users sign in
  again. Deactivation blocks authenticated requests and refresh by current DB status.
- **Checkpoint:** approved mapping of each tenant-owned query/mutation to its enforcing
  repository/service and a deterministic backfill plan. No database migration until passed.

### Phase B — Persistence and migration

- Add tenant schema and repository contract/adapter.
- Update user schema for nullable tenant only on `super_admin`; model tenant active status.
- Generate and review migration; create initial tenant row, backfill existing users/data,
  then add foreign keys and non-null constraints where applicable.
- **Checkpoint:** `pnpm db:generate -- --name add_tenant_foundation` produces reviewed SQL,
  snapshots and journal; `pnpm db:check` passes on a verified development branch.

### Phase C — Auth, authorization, and server tenant scope

- Extend login and refresh records/token claims; create an actor context from a verified
  token plus current DB state.
- Update `withAuth`/role/permission wrappers and role policy to distinguish `super_admin`
  from tenant `admin`.
- Add tenant predicates to every local tenant-owned query and mutation; ensure create uses
  actor scope and foreign IDs cannot cross tenant boundaries.
- Update role assignment and role CRUD to prevent tenant admin cross-tenant access and
  super-admin escalation.
- **Checkpoint:** QA RED evidence covers auth, cross-tenant access, inactive tenants, role
  boundaries, and token refresh before implementation behavior is accepted.

### Phase D — Tenant API, seed, `/me`, and OpenAPI

- Implement tenant list/search/pagination and create/rename/status use cases.
- Extend seed roles/accounts and ensure repeatability/collision safety.
- Return super-admin navbar/permissions and tenant summary from `/api/users/me`.
- Update OpenAPI contracts/generated output and auth/role/tenant specs and auth CONTEXT.
- **Checkpoint:** `pnpm openapi:generate`, `pnpm openapi:check`, `pnpm db:check`,
  `pnpm typecheck`, `pnpm lint`, and focused QA-owned tests pass against development data.

### Phase E — Tenant Management UI

- Add FE `ModuleKey`, permission tree/mapping, icon, sidebar entry, locale strings, feature
  `CONTEXT.md`, route, loading/error pages, guarded page, hooks, table and dialogs.
- Implement URL-backed search/page/limit, list query and mutation invalidation.
- **Checkpoint:** QA-owned UI tests cover authorization, search, pagination, create/edit,
  active/deactive, errors, and accessibility; verify both locales in browser.

### Phase F — Rollout verification

- Apply migration only to a verified development branch; run `pnpm db:seed` and validate
  all four accounts and tenant assignments without printing credentials.
- Verify old-token behavior and the selected rollout/session invalidation strategy.
- Run full `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, OpenAPI checks, then
  browser verification and E2E against the real backend.
- **Checkpoint:** no API path can reach tenant-owned data without a server-derived scope;
  list all skipped checks and any upstream deployment dependency.

## 3. Work that can run in parallel

- During Phase A, QA can draft the case inventory from the approved specs, but must not add
  tests until the implementation plan is approved and must establish RED evidence before
  behavior is accepted.
- After migration shape and actor contract are approved, auth/roles and tenant API
  implementation can proceed in parallel with QA test authorship, following the repo's
  ownership split. FE work can start once the API contract and permission key are stable.
- Schema/migration, auth claim contract, and FE data hooks are sequential dependencies; do
  not build UI against an unapproved request/response shape.
- No tests are authored by the implementation role. QA owns every test file.

## 4. Risks and mitigations

- **Invitation onboarding is upstream-backed.** A locally tenant-bound user model is not
  enough if invite acceptance creates a separate upstream user. Bind tenant from a
  server-validated invite record or migrate/provision the user into the local auth store;
  never accept a free-form tenant ID from the registration form.
- **Future business endpoints may be proxied.** The generic proxy cannot enforce row-level
  scope. Any endpoint that queries tenant data must implement scope in its owning API
  service/repository before it is exposed through the proxy.
- **Backfill mistakes can expose or orphan data.** Select the initial tenant explicitly,
  rehearse migration on a development branch with production-like data, inspect counts and
  relations, and only then enforce constraints.
- **Admin wildcard currently means platform access.** Replace that semantic carefully and
  preserve intended tenant-admin capabilities with explicit action permissions.
- **Existing access tokens lack tenant claims.** Define a cutover (short wait for expiry,
  forced logout, or compatible reissue) and ensure old tokens cannot receive fallback scope.
- **Deactivation and active sessions can race.** Check tenant/user status on protected
  requests and refresh; revoke refresh sessions or reject them on lookup.
- **Seed and migration tenant IDs can diverge.** Use one approved ID literal for migration
  and require seed configuration to match it; fail fast on mismatch.

## 5. Decisions that block implementation

- Tenant-aware invitation provisioning is out of scope for this delivery and must be planned
  before invited upstream users receive local API access.
