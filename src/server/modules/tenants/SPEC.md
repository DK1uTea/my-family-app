# Spec: Tenant management and server-enforced tenant isolation

## Status

Approved for implementation using the defaults recorded below.

## Objective

Add platform-level tenant management and isolate tenant-owned data on the server. The
browser never selects a tenant by header or request body. The server derives the caller and
scope from its verified access token and current database records.

## Roles and scope

- `super_admin` is a platform role, seeded from `SEED_SUPER_ADMIN_EMAIL` and
  `SEED_SUPER_ADMIN_PASSWORD`. The matching seeded account is promoted to this role and
  has no tenant assignment. It can manage tenants and may
  access data across tenants where the API policy permits it.
- `admin` is a tenant administrator. It is assigned to exactly one active tenant and is
  scoped to that tenant. It does not receive platform-wide wildcard access.
- `adult` and `child` are tenant roles and are scoped to their assigned tenant.
- The role catalog remains backend-owned. Tenant membership is stored in the database;
  tenant selection is not accepted from FE headers or payloads.

## Tenant API

All endpoints require authentication and the `super_admin` role:

- `GET /api/tenants?search=&page=&limit=&sort=createdAt:desc` returns
  `{ items, pagination }` inside the standard response envelope. `pagination` contains `total`, `limit`, `page`, `totalPages`,
  `hasNextPage`, and `hasPrevPage`. Search matches tenant name and ID. Default page is 1
  and default limit is 10; maximum limit is 100.
  Sorting accepts `createdAt:desc` (default) or `createdAt:asc`; any other value returns
  `TENANT_SORT_INVALID`. Tenant ID is used as a stable tie-breaker.
- `POST /api/tenants` creates an active tenant from `{ name, description? }`. The module
  generates the immutable tenant ID from a short normalized name slug and UUID suffix; the
  resulting ID is at most 50 lowercase letters, digits, or hyphens.
- `PATCH /api/tenants/{id}` updates the tenant name and optional description.
- `PATCH /api/tenants/{id}/activate` activates a tenant without a request payload.
- `PATCH /api/tenants/{id}/deactivate` deactivates a tenant without a request payload.
  Both operations are idempotent. Deactivation does not delete tenant data.
- Tenant responses contain `id`, `name`, nullable `description`, `isActive`, `createdAt`, and `updatedAt`.
- Invalid input and collisions on generated tenant IDs return documented validation/conflict
  errors. The create payload cannot supply an ID.

## Authentication and tenant enforcement

- Login reads role and tenant membership from the database. Only active tenant users may
  establish a session. `super_admin` is the only role allowed to have `tenantId = null`.
- Access tokens carry the server-established `sub`, `email`, `roleKey`, and `tenantId` claims. Every
  protected request verifies the token, loads current role/tenant state, and builds an
  actor context. Database role or tenant changes take effect on the next request; stale
  claims cannot grant broader access.
- Refresh re-reads the user and current tenant state before issuing a new access token.
- Tenant-owned create operations take tenant scope from actor context. Reads and mutations
  by ID include tenant scope in repository predicates. A normal user cannot change scope by
  supplying a tenant ID.
- Cross-tenant reads and mutations are allowed only in explicit `super_admin` policies.
- Deactivating a tenant immediately blocks its users on subsequent authenticated requests
  and refresh. Existing refresh sessions are rejected; the access-token request path also
  checks current tenant status.
- Tenant management permission appears in the permission catalog. `super_admin` receives
  that permission and the `tenant-management` navbar key; tenant roles do not.
- `GET /api/users/me` returns the current tenant summary (nullable for `super_admin`) in
  addition to `role: { key, name, navbar, permissions }`.

## Data migration

- Add `tenants`; add a non-null tenant foreign key to tenant-owned records and tenant users.
- Existing users and tenant-owned rows are assigned to one explicitly approved initial
  tenant `default` by a reviewed migration. The migration inserts tenant ID `default` and
  name `Default Tenant`; seed configuration must use the same ID. All existing users are
  backfilled to `default`, then the super-admin seed step clears that account's tenant ID.
  The migration must not silently assign records at runtime.
- Email remains globally unique in this proposal. Tenant ID is globally unique.
- Preserve user passwords and role assignments when assigning existing users to the
  initial tenant. Existing admin users become tenant-scoped `admin`; the configured seed
  super admin is handled separately.

## Seed behavior

- `pnpm db:seed` remains development-only and idempotent.
- Seed one tenant from `SEED_TENANT_ID` and `SEED_TENANT_NAME`.
- Ensure built-in role records exist. `super_admin` is not tenant-bound; `admin`, `adult`,
  and `child` accounts are assigned to the seeded tenant.
- Seed tenant role accounts using `SEED_TENANT_ADMIN_EMAIL/PASSWORD`,
  `SEED_TENANT_ADULT_EMAIL/PASSWORD`, and `SEED_TENANT_CHILD_EMAIL/PASSWORD`.
- Never overwrite existing credentials or role assignments without an explicit reset flag.
  Fail on conflicting emails or a role account assigned to a different tenant.
- Invite acceptance, registration, password recovery, and avatar upload continue through
  their current upstream integration in this delivery. These flows do not grant local API
  access unless a matching local user with a valid tenant membership exists; tenant-aware
  invite provisioning is a follow-up.

## Architecture

- HTTP routes/controllers under `src/app/api/tenants/`; use cases under this module.
- Persistence contract and Drizzle adapter under `src/server/layer-data/tenants/`.
- Tenant schema under `src/server/drizzle/schema/`; migrations follow `src/server/README.md`.
- Shared auth policy returns an actor context. Services enforce use-case policy; repositories
  enforce tenant predicates. Controllers do not access Drizzle.
- Update auth, roles, users, and every tenant-owned domain spec/API touched by implementation.
- Add contracts in `src/server/openapi/contracts.ts` and regenerate OpenAPI.

## QA coverage (QA-owned)

- Super admin can list/create/edit/activate/deactivate tenants; all tenant roles receive 403.
- Search, pagination, validation, generated ID uniqueness, and idempotent status updates work.
- Tenant A cannot list/read/update/delete tenant B records, including by guessed record ID.
- Tenant users cannot override scope via header, query, or body; create uses token actor scope.
- Super admin can access permitted cross-tenant APIs; tenant management permission and
  navbar are present only for super admin.
- Login, refresh, and authenticated requests reject inactive tenants and stale role/scope.
- Seed is repeatable, creates all requested accounts, and preserves existing credentials.
- Migration assigns all pre-existing tenant-owned rows and users to the approved tenant.

## Assumptions to confirm

- Tenant seed values and tenant role credentials are supplied by environment variables.
- Email is globally unique, matching the current `users.email` constraint.
- Tenant search covers both name and ID; default page size is 10, max 100.
- Tenant deactivation immediately blocks existing access tokens on the next API request.
- Existing users are initially assigned to tenant `default`; the configured super-admin
  seed promotes the matching account and removes its tenant assignment.
- The tenant module uses a permission-gated sidebar route and the key `tenant-management`.

## Success criteria

- Only `super_admin` can manage tenants or cross tenant boundaries.
- Every tenant-owned query and mutation is tenant-scoped on the server.
- The FE sends no tenant selection header and cannot select another tenant's scope.
- `/api/users/me` provides the navbar and permissions needed to expose Tenant Management.
- Seed, migration, API contract, FE behavior, and QA cases conform to the approved spec.


