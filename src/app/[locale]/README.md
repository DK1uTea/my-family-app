# Route map

| Route group | Current routes | Context |
| --- | --- | --- |
| Authentication | Login, registration, password recovery | `src/features/auth/CONTEXT.md` |
| Private | `/dashboards` | `src/features/dashboard/CONTEXT.md` |
| Private | `/settings` | Route scaffold; no Settings behavior yet |
| Private | `/event-timeline` | `src/features/event-timeline/CONTEXT.md` |

The private layout bootstraps `/api/users/me` before rendering the shell.
Dashboard and Settings always appear in the sidebar. Event Timeline appears when
`role.navbar` includes `event-timeline` or `*`. Its server-rendered page checks the
same module key before showing content.
