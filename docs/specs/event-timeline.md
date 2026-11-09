# Event Timeline route placeholder

**Status:** Approved route-access placeholder. The module's business behavior is not yet
specified.

## Access contract

- The route is `/{locale}/event-timeline` and its module key is `event-timeline`.
- The signed-in admin role returns `role.navbar: ["*"]` from `GET /api/users/me`; the
  wildcard grants access to every module.
- Dashboard and Settings remain visible in the sidebar regardless of module grants. An
  admin with `*` also sees Event Timeline.
- An authenticated admin can open Event Timeline from its sidebar item and by navigating
  directly to `/vi/event-timeline`. Both paths render the page heading and localized
  coming-soon placeholder.
- An unauthenticated direct request to `/vi/event-timeline` redirects to `/vi/login`.
- No dedicated restricted-role account is configured; the restricted-module branch is not
  covered by this browser spec.

## Placeholder behavior

- The page exposes the stable heading hook `event-timeline-heading`.
- The current page is informational only. It has no data API, form, workflow, status, or
  mutation behavior.
- Before adding business behavior, write and approve a separate module specification. Every
  Event Timeline API must enforce `event-timeline` access on the server.

## QA coverage

- The open flow spec checks the live admin navbar response, the always-visible Dashboard
  and Settings links, Event Timeline sidebar access, and direct navigation to the route.
- The routing aspect checks the unauthenticated direct-access redirect in a fresh browser
  context.
