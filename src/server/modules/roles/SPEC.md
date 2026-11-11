# Spec: Roles and permissions

## Objective

Provide backend-owned role and action permissions. A role may access modules and perform
actions only when its granted permission keys satisfy the endpoint policy.

## Contract

- Built-in role keys are `super_admin`, `admin`, `adult`, and `child`, represented in server code by
  `UserRole`. Other role records may be created for permission-based policies.
- The backend role module owns the permission catalog. Server code must not import FE
  constants from `src/shared`.
- The catalog is hierarchical by module and exposes selectable leaf permissions. Event
  Timeline keys are `event-timeline.read`, `.create`, `.edit`, `.delete`, and `.upload`.
- Roles persist `permissionKeys: string[]`. `*` is reserved for `super_admin` and unknown keys are
  rejected on create/update.
- `super_admin` has `*`; tenant `admin` has all Event Timeline permissions but no
  Tenant Management permission; `adult` has all Event Timeline permissions; `child`
  has only `event-timeline.read` and `event-timeline.upload`.
- `role.navbar` is derived from module read permissions. It contains module keys when the
  role has `<module>.read`; wildcard `super_admin` gets `['*', ...moduleKeys]`. Dashboard and Settings are
  outside this catalog.
- `GET /api/users/me` returns `role: { key, name, navbar, permissions }`. Missing role data
  produces empty permission and navbar lists.
- Role changes are read from the database on the next access check and `/me` fetch, not
  stored in JWT claims.

## Authorization policies

- Every private API requires authentication. No additional role/permission policy means
  every authenticated role may call the endpoint.
- `requireRoles([...])` checks role identity; routes must include `SUPER_ADMIN` explicitly
  where platform access is intended. Super admin is not every tenant role.
- `requirePermissions([key])` checks granted permission keys; only super-admin wildcard
  bypasses it.
- When a route declares both policies, both must pass. Multiple keys in one policy use OR
  semantics. Missing/invalid auth returns 401; authenticated denial returns 403.
- Global role CRUD requires `UserRole.SUPER_ADMIN`. Role assignment accepts tenant admin
  only within its tenant or super admin across tenants; no caller may assign `super_admin`.
  A tenant admin cannot remove their own admin role through `PUT /api/users/{id}/role`.
- No Event Timeline business endpoint exists yet. Its page requires the read permission;
  future API endpoints must declare action permissions and any explicit role restriction.

## Admin endpoints

- `GET /api/permissions`: hierarchical permission catalog for admin and super admin.
- `GET /api/roles`: list roles and permission keys (super admin only).
- `POST /api/roles`: create a non-built-in role (super admin only).
- `GET /api/roles/{key}` and `PUT /api/roles/{key}`: inspect/update a non-built-in role
  (super admin only).
- `PUT /api/users/{id}/role`: assign an existing role to an existing user.
- Role routes apply the policies above and delegate HTTP parsing/status mapping to
  `src/app/api/roles/roles.controller.ts` and
  `src/app/api/users/users.controller.ts`.
- The permission catalog is returned by `RolesService`; role services validate known
  permission keys, reserve the `admin` role from edits, and enforce the self-demotion rule
  for assignments. Controllers translate service result variants into HTTP responses.

## Persistence and migration

- Roles live in Postgres; `users.role_key` identifies the assigned role.
- The role JSONB column `permission_keys` was backfilled from historical module grants.
  Keep `module_keys` intact as a rollback source; application code stops reading it.
- Replace admin wildcard with explicit tenant permissions and reserve wildcard for the
  configured platform super admin. Preserve adult/child grants and all user assignments.
  Tenant Management permissions are not granted to tenant roles.
- Legacy user-level `permissions` and `navbar` columns were removed after role-derived
  access replaced them. The development seed writes neither column.
- New users have no role until explicitly assigned. No migration automatically assigns a
  role to a user.

## QA coverage

QA owns tests for permission validation, role checks, wildcard bypass, role CRUD, navbar
derivation, `/me` permissions, and migration behavior. Dev does not create or edit tests.
