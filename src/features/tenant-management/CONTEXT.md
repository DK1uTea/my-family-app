# Tenant Management context

The `/tenant-management` route is available only to the `super_admin` role. The
sidebar visibility comes from the `tenant-management` navbar key; the page also
checks `tenant-management.read`. The server independently requires the exact
`super_admin` role for every tenant API operation.

The table searches tenant ID and name and stores `search`, `page`, `limit`, and
`sort` in the URL. Sorting supports `createdAt:desc` (Newest, default) and
`createdAt:asc` (Oldest); the server validates and applies the requested sort.
`GET /api/tenants` returns `{ items, pagination }`, where `pagination`
uses the shared `PaginationType` contract. The FE consumes this response shape directly.
Each tenant mutation has its own React Query hook; successful mutations invalidate the
tenant list query. Super admins can create a tenant with a backend-generated immutable ID,
name, and optional description, edit its name and description, and activate or deactivate it. Deactivation takes effect on the next
protected request for users in that tenant. Tenant management does not provision tenant users.
Activation and deactivation use separate payload-free endpoints:
`PATCH /api/tenants/{id}/activate` and `PATCH /api/tenants/{id}/deactivate`.
The tenant form uses React Hook Form with a Zod schema: names are 1–150 characters and
optional descriptions are at most 500 characters. The backend generates an immutable ID
from a short normalized name slug and a UUID suffix; the create request never accepts an ID.

