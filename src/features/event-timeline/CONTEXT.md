# Event Timeline context

Event Timeline is the first module gated by role and action permissions. Its route is
`/[locale]/event-timeline` and its module key is `event-timeline`. The sidebar displays
it only when `/api/users/me` returns `role.navbar` containing this key or `*`. The page
requires `event-timeline.read`; future APIs and components require their action keys such
as `event-timeline.create`. The backend owns its permission catalog and exposes it through
`GET /api/permissions`; frontend route/component guards use FE-owned permission keys and
the user's granted keys from `/api/users/me`, without importing the server catalog.

`event-timeline.upload` is reserved for a future upload action; no current route accepts
uploads. The current page is a route placeholder. No Event Timeline data endpoint, form,
workflow, status, or mutation has been specified yet. Before adding those behaviors,
write and approve a separate module spec. Every Event Timeline API must check the
module key on the server, including direct requests that bypass the sidebar.
