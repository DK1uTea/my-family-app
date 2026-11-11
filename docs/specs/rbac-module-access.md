# Spec: Role and permission based access

## Objective

Give each role permission keys for module access and actions. The backend enforces every
API policy. The frontend uses `/me` permissions to guard routes and components, while the
existing sidebar continues using `role.navbar`.

## Assumptions

- Every private API still requires authentication. A route without a role/permission policy
  is callable by every authenticated role.
- `UserRole` identifies built-in roles: `ADMIN`, `ADULT`, and `CHILD`. Other role rows may
  be created for permission-based access.
- `admin` with `*` bypasses role and permission requirements.
- The Event Timeline page requires its read permission. The example POST policy requires
  both `ADULT` role and the create permission; child is denied.
- No Event Timeline business API or role-management UI is created by this change.

## Permission contract

- The backend owns a hierarchical permission catalog and returns it from `GET /api/permissions`.
- Permission keys are stable strings. The first module has leaf keys
  `event-timeline.read`, `event-timeline.create`, `event-timeline.edit`, and
  `event-timeline.delete`.
- Roles persist `permissionKeys: string[]`. The `*` wildcard is reserved for admin and is
  not accepted when creating or editing a non-admin role. The legacy `module_keys` column
  remains intact as a rollback source during this transition.
- The server catalog is not imported by the frontend. Frontend feature constants define keys
  used by UI guards; the permission editor can render the backend catalog response.
- `role.navbar` remains a derived list of module keys. It contains `event-timeline` when
  the role has `event-timeline.read`, and `*` for wildcard admin. Dashboard and Settings
  remain always visible and are not permission catalog entries.

## Role and API behavior

- `admin` has `*`.
- `adult` has `event-timeline.read/create/edit/delete`.
- `child` has `event-timeline.read` only.
- `requireRoles([UserRole.ADULT])` permits adult and wildcard admin; child receives 403.
- `requirePermissions([PermissionKey.EventTimeline.Create])` permits a role with that key
  and wildcard admin. Multiple required keys use OR semantics, matching the FE helper.
- A policy combining role and permission checks requires both checks to pass, except admin
  wildcard bypass.
- Missing/invalid authentication returns 401. Authenticated callers missing a required
  role or permission receive 403.
- `/api/users/me` returns `role.key`, `role.navbar`, and `role.permissions` derived from the
  persisted role. Missing role data yields empty lists, never implicit access.

## Frontend behavior

- `useMe()` stores `role.permissions` separately from `role.navbar`.
- `useHasPermission` grants on any required key or wildcard. `null` means not loaded and
  temporarily allows rendering, consistent with the referenced MEP pattern; `[]` denies.
- `RouteGuard` renders `ForbiddenView` without the required permission.
- `ComponentGuard` renders no child content without the required permission.
- Guards control presentation only. Backend route policies remain authoritative.
- The existing sidebar filter and its always-visible Dashboard/Settings/Logout entries stay
  unchanged.

## Persistence and migration

- Add `permission_keys` and backfill it from the existing module grants. Keep
  `module_keys` unchanged as a rollback source; application code stops reading it.
- Preserve admin wildcard. Convert existing `event-timeline` module grants to `read`;
  seed adult with all four Event Timeline permissions and child with `read` only.
- Preserve users' current `role_key` assignments. Do not assign or change a user's role.
- Legacy user-level `permissions` and `navbar` columns were removed; role permissions
  are the only source of access grants.

## QA coverage

QA owns tests for role and permission checks, admin bypass, unknown permission rejection,
navbar derivation, `/me` response, FE OR/wildcard/loading behavior, both guards, and migration
behavior. Dev does not edit test files.

## Out of scope

- Event Timeline CRUD endpoints or business workflows.
- Role-management screens. The backend catalog endpoint is prepared for a future editor.
- Object-level or family/tenant data isolation.
