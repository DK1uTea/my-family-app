# Tasks: Multi-tenant foundation and Tenant Management

## Status

Approved task breakdown. Tenant seed defaults are `default` / `Default Tenant`; the
configured super-admin account becomes tenantless. Invite provisioning remains out of scope.

Implementation is complete through the tenant UI and API. `pnpm typecheck`, `pnpm lint`,
and `pnpm openapi:check` pass; QA's focused component/API suite passes. Migration, database
seed, production build, and browser E2E remain pending: Neon status cannot reach the API in
this environment, tenant role seed credentials are unset, and `next dev` cannot load the
Windows SWC native binding.

## Gate 0 — Approved defaults

- [x] **Product/Dev:** Approved implementation defaults: initial tenant `default` /
  `Default Tenant`; configured super-admin seed is tenantless; existing other users are
  backfilled to `default`. Invite provisioning stays upstream and is out of scope; local
  APIs reject users lacking valid local membership.

## QA and DEV — start in parallel after Gate 0

- [x] **QA:** Add role-policy tests for `super_admin` vs tenant `admin`, wildcard
  behavior, tenant mismatch, and inactive tenant rejection.
  - Files: `tests/server/modules/roles/roles.service.test.ts`,
    `tests/app/api/_shared/require-roles.test.ts`, new focused auth/tenant test files.
  - Acceptance: RED for the intended missing/incorrect policy, not setup failures.
  - Verify: focused `pnpm test <test-file>` commands fail on the pre-change behavior.

- [x] **DEV:** Add tenant schema and relations, then generate and review the migration.
  - Files: `src/server/drizzle/schema/tenants.ts`, `schema/users.ts`, `schema/index.ts`,
    generated migration SQL/snapshot/journal.
  - Acceptance: tenant table, nullable user tenant FK for platform super admin, and safe
    backfill path for all existing user rows; no unscoped runtime fallback.
  - Verify: `pnpm db:generate --name add_tenant_foundation`; review generated diff;
    `pnpm db:check` on verified development configuration only.

- [x] **DEV:** Add tenant repository contract and Drizzle adapter for lookup, list/search,
  create, rename, and status update.
  - Files: `src/server/layer-data/tenants/tenants.repository.ts`, `tenants.types.ts`,
    `tenants.drizzle-adapter.ts`, `tenants/index.ts`.
  - Acceptance: persistence contract supports stable sort, page/limit and total count;
    status update is idempotent.
  - Verify: `pnpm typecheck`; DB-backed checks remain on development branch.

- [x] **DEV:** Extend credential and refresh persistence projections with role and tenant
  membership needed by auth policy.
  - Files: `src/server/layer-data/auth/auth.types.ts`, `auth.repository.ts`,
    `auth.drizzle-adapter.ts`, `src/server/layer-data/users/users.types.ts`,
    `users.drizzle-adapter.ts`.
  - Acceptance: auth can load tenant ID/status and role from trusted DB records; no request
    field is used as tenant authority.
  - Verify: `pnpm typecheck`; QA-owned repository/service tests pass after re-run.

- [x] **DEV:** Add tenant/role claims to JWT sign/verify and refresh issuance; construct the
  authenticated actor context and reject stale or inactive membership.
  - Files: `src/server/modules/auth/auth.jwt.ts`, `auth.types.ts`, `auth.service.ts`,
    `src/app/api/_shared/require-authenticated.ts`, `src/app/api/_shared/require-roles.ts`.
  - Acceptance: tenant users have a valid tenant claim; `super_admin` has null tenant;
    inactive/missing tenant or mismatched current DB membership cannot authenticate.
  - Verify: `pnpm typecheck`; QA-owned focused auth/policy tests pass after re-run.

- [x] **DEV:** Add platform/tenant authorization policies and scope role/user administration.
  - Files: `src/server/modules/roles/permissions.ts`, `roles.service.ts`,
    `src/app/api/_shared/require-roles.ts`, `src/app/api/users/users.controller.ts`.
  - Acceptance: only `super_admin` has platform-wide bypass; tenant admin cannot inspect or
    assign users across tenants or grant `super_admin`.
  - Verify: focused QA tests, then `pnpm typecheck` and `pnpm lint`.

- [x] **DEV:** Implement tenant service/controller and route handlers.
  - Files: `src/server/modules/tenants/tenants.service.ts`, `modules/tenants/index.ts`,
    `src/app/api/tenants/tenants.controller.ts`, `src/app/api/tenants/route.ts`,
    `src/app/api/tenants/[id]/route.ts`.
  - Acceptance: super-admin-only paginated search, create, rename, activate/deactivate;
    validation and conflict responses match spec.
  - Verify: focused QA-owned controller tests; `pnpm typecheck` and `pnpm lint`.

- [x] **DEV:** Add tenant route policies and API contracts, then regenerate OpenAPI.
  - Files: tenant status route/controller as needed, `src/server/openapi/contracts.ts`,
    `src/server/openapi/generated.json`.
  - Acceptance: every tenant method is super-admin-only and documented with matching
    request/response/error contracts.
  - Verify: `pnpm openapi:generate`, `pnpm openapi:check`.

- [x] **DEV:** Update user profile response and permission/navbar derivation for platform
  scope; include nullable tenant summary.
  - Files: `src/server/layer-data/users/users.types.ts`,
    `src/server/layer-data/users/users.drizzle-adapter.ts`,
    `src/server/modules/users/users.service.ts`, `src/app/api/users/users.controller.ts`.
  - Acceptance: super admin receives tenant-management permission/navbar; tenant roles do
    not; existing response fields remain compatible.
  - Verify: QA-owned users controller and `useMe` tests; `pnpm typecheck`.

- [x] **DEV:** Extend development seed for tenant, super admin and tenant admin/adult/child.
  - Files: `src/server/modules/auth/seed-users.ts`, seed repository interfaces/adapters,
    `scripts/seed-user.ts` or current seed entry point, auth spec.
  - Acceptance: repeatable seed; credentials/role assignments not overwritten without the
    explicit reset flag; configured super admin is tenantless; tenant accounts share the
    configured tenant; fail on ID/email mismatch.
  - Verify: QA-owned seed unit tests; `pnpm db:seed` only after verifying development branch.

## FE module — start after API and permission contract stabilize

- [x] **DEV:** Add tenant-management permission key, icon and sidebar registration.
  - Files: `src/shared/constants/permissions.ts`, icon file, icon index,
    `src/shared/components/common/layout/app-sidebar.tsx`.
  - Acceptance: nav item appears only for the returned key/wildcard and uses the module key
    agreed with the backend.
  - Verify: focused sidebar/permission QA tests; `pnpm typecheck`, `pnpm lint`.

- [x] **DEV:** Add tenant-management navigation and feature messages in both locales.
  - Files: `src/messages/en.json`, `src/messages/vi.json`.
  - Acceptance: all new navigation and page copy have matching English and Vietnamese keys.
  - Verify: locale JSON parses and `pnpm lint` passes.

- [x] **DEV:** Build the guarded Tenant Management route, data hooks, table, pagination and
  create/edit/status dialogs; add feature CONTEXT and loading/error routes.
  - Files: at most five files per focused subtask under `src/features/tenant-management/`
    and `src/app/[locale]/(private)/tenant-management/`; locale feature strings in both
    message files.
  - Acceptance: URL-backed search/page/limit; accessible add/edit dialogs; row actions
    update status and invalidate list query; all states localized.
  - Verify: `pnpm typecheck`, `pnpm lint`; browser verification after QA E2E is ready.

- [ ] **QA:** Add real-backend E2E flow for Tenant Management and accessibility coverage.
  - Files: `e2e/modules/tenant-management/tenant-management.page.ts`,
    `.data.ts`, flow spec, a11y spec as needed by the approved flow structure.
  - Acceptance: one flow spec per business journey, authenticates via approved session
    helper, uses `data-testid`, and exercises real tenant API; no success-response mocking.
  - Verify: `pnpm test:e2e tenant-management` and accessibility scan against both locales.

## Final verification

- [ ] **DEV + QA:** Run `pnpm db:check`, `pnpm openapi:check`, `pnpm test`,
  `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm test:e2e` against the configured
  development services. Apply DB migrations only after verifying Neon development branch.
- [ ] **DEV:** Update `src/server/SPEC.md`, tenant/auth/roles/users specs,
  `src/features/auth/CONTEXT.md`, and new `src/features/tenant-management/CONTEXT.md` to
  match delivered behavior; list any upstream registration limitation explicitly.
