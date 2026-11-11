# Spec: API controller boundary

## Objective

Keep Next.js `route.ts` files short and make each HTTP endpoint's controller-to-service
relationship visible, without changing existing URLs, authorization, request/response
contracts, cookies, or business behavior.

## Multi-tenant boundary

- `super_admin` is platform-scoped and tenantless. It alone manages tenants and may access
  explicitly permitted cross-tenant operations.
- `admin`, `adult`, `child`, and custom tenant roles require an active tenant assignment.
  Access tokens carry DB-derived `roleKey` and `tenantId`; protected requests reload current
  identity/scope and reject missing, stale, or inactive membership.
- First-party tenant-owned repositories include the actor's tenant in every read or
  mutation predicate. Create operations derive tenant from actor context, never FE headers
  or payload. Current first-party data is users/preferences/auth; roles and tenants are
  platform-level. Future business modules follow the same scope rule.
- The generic external API proxy does not provide row-level isolation. A future proxied
  endpoint that reads tenant data must enforce scope in its owning upstream service.
- Tenant CRUD routes are super-admin-only. `/api/users/me` returns tenant-management
  navbar/permission data for platform super admin.

## Scope

- First-party business endpoints under `src/app/api/auth/`, `users/`, `roles/`,
  `permissions/`, and `/api/clear-cookies`.
- Keep proxy, Swagger/OpenAPI document, and health-check routes as infrastructure handlers.
- No new service or dependency-injection framework.

## Architecture and behavior

- `route.ts` exports supported HTTP methods, attaches route-level auth/role policies, and
  maps each method to one controller function.
- Controllers live under the matching `src/app/api/<module>/` boundary. They own HTTP
  parsing, Zod validation, status/response mapping, and cookie handling, then call existing
  server module services. Controllers may use Next request/response types.
- Controllers do not contain repository/Drizzle access or business rules. Those remain in
  `src/server/modules/<domain>/` and `src/server/layer-data/<domain>/` respectively.
- Keep controller files at or below 200 lines; split larger groups by endpoint/use case.
- Existing shared auth-policy wrappers remain the authorization boundary and preserve their
  current status codes and role/permission behavior.
- Infrastructure handlers that do not delegate a business use case remain direct handlers.

## QA coverage

QA owns tests for existing endpoint behavior before and after extraction: authentication and
authorization outcomes, validation/status responses, successful service delegation, profile
preference cookies, and auth session cookies. E2E remains real-backend and is updated only
where an existing flow directly calls an affected endpoint.

## Success criteria

- Business route files contain only method exports and controller/policy mappings.
- Every in-scope controller delegates business work to the existing module service.
- All current endpoint URLs and OpenAPI operations remain unchanged.
- QA-owned focused tests, OpenAPI check, typecheck, and lint pass; any pre-existing failures
  are recorded separately.
