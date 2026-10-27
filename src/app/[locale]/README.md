# Route module contexts

Each route module has one `context.md` next to its route entry. The context is
the module hand-off document: read it before changing the route, its feature
hooks, or its API flow.

| Module | Context |
| --- | --- |
| Authentication | [`(auth)/context.md`](<./(auth)/context.md>) |
| Dashboard | [`(private)/dashboards/context.md`](<./(private)/dashboards/context.md>) |
| Calendar | [`(private)/calendar-dashboard/context.md`](<./(private)/calendar-dashboard/context.md>) |
| Customer activation (CAM) | [`(private)/customer-activation/context.md`](<./(private)/customer-activation/context.md>) |
| Events | [`(private)/events/context.md`](<./(private)/events/context.md>) |
| Rental | [`(private)/rent/context.md`](<./(private)/rent/context.md>) |
| Reporting tool | [`(private)/reporting-tool/context.md`](<./(private)/reporting-tool/context.md>) |
| User settings | [`(private)/user-settings/context.md`](<./(private)/user-settings/context.md>) |
| Public policies | [`(public)/[policy]/context.md`](<./(public)/[policy]/context.md>) |

## Shared request pipeline

```text
route page
  -> feature entry component
  -> feature hook/service
  -> TanStack Query or form mutation
  -> apiProxy (/api) or an explicit auth/upload/realtime transport
  -> Next.js route handler / catch-all proxy
  -> backend module
  -> response envelope/interceptor
  -> query cache and UI
```

`apiProxy` attaches the bearer token, locale, visitor identifier and tenant
headers. The catch-all proxy routes `etr`, `tf`, `cam` and `notification` prefixes
to their matching backend; unprefixed paths go to `core`. The auth contexts
document the special cookie handlers.
