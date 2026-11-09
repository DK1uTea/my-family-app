# Authentication feature context

This is the canonical business and API context for `src/features/auth`. Update it
in the same change whenever authentication behavior, validation, routing, cookies,
session handling, permissions bootstrap, or an auth endpoint changes.

## Scope and routes

Public routes: `/[locale]/login`, `/forgot-password`, `/registration`,
`/reset-password`. The module also owns `AppInitializer`, which bootstraps the
current user before private pages render.

Route guard: `src/proxy.ts` treats a request as authenticated when either
`accessToken` or `refreshToken` exists. Auth pages redirect authenticated users to
`/[locale]/dashboards`; all other pages redirect unauthenticated users to login.

## Runtime flow

### Login and bootstrap

```text
LoginForm
  -> POST /api/auth/login
  -> auth login controller validates CAPTCHA and calls authService.login
  -> AuthService uses the auth repository and Neon to verify credentials and create the session
  -> auth login controller calls usersService for the authenticated user's preferences
  -> cookies are set (access, refresh, locale, appearance)
  -> private layout mounts AppInitializer
  -> GET /api/users/me
  -> users controller validates the access token and calls usersService
  -> UsersService loads profile, preferences, and role through the users repository
  -> useUserStore receives profile, role navbar, action permissions and settings
  -> dashboard/app renders
```

The access token and refresh token are both httpOnly.
Browser JavaScript cannot read tokens directly. `src/app/api/[...path]/route.ts`
reads the `accessToken` cookie on the server and attaches `Authorization: Bearer <token>`
when proxying to the upstream API. The first-party `/api/users/me` route maps `GET` to the
users controller, which reads the token and calls `usersService`. `src/lib/api.ts` handles token refresh reactively
upon receiving a 401 error. Failed refresh clears cookies, broadcasts `LOGOUT`
over `BroadcastChannel("auth")`, and redirects to the locale login page.

Login rules:

- Email must be valid; password is required and has a six-character client-side
  minimum.
- The client waits up to five seconds for reCAPTCHA v3, executes action `login`,
  and does not submit without a token.
- The login controller validates CAPTCHA before passing email, password and `rememberMe`
  to `authService`.
- The auth service's wrong-password result is normalized to `WRONG_PASSWORD` plus the live
  `attemptsRemaining` value. The form displays that value inline under password.
- `AUTH.LOGIN.ACCOUNT_LOCKED` is displayed inline with the backend lock duration;
  the UI falls back to 15 minutes only when no duration is returned.
- Status `200` is normal success. Status `203` is also successful login, but means
  the user should be warned to change their password. The backend message is
  shown as a warning before navigation.
- `redirectTo` from the login URL wins after success; otherwise navigation goes
  to `/dashboards`.

Cookie/session rules:

- `accessToken`: httpOnly, 15 minutes, path `/`.
- `refreshToken`: httpOnly, seven days, path `/`.
- Locale and appearance come from the local user's preferences during login; invalid/missing
  values fall back to Vietnamese (`vi`) and `light`.
- Reactive refresh handles expired access tokens on 401 status. Concurrent requests
  wait on the same refresh queue.
- Failed GET requests are retried once after successful refresh.
- Logout best-effort revokes the local auth service session, always clears cookies via Next.js
  endpoints, broadcasts `LOGOUT`, then performs a full redirect to the locale login page.
- The authenticated shell places the brand logo in the sidebar header and the logout
  action in the sidebar footer. The avatar menu keeps the user-settings link; both shell
  entry points use the existing `clientLogout()` flow.

### Invite registration

```text
POST /api/auth/verify-invite-user
  -> validate invite
  -> POST /api/auth/accept-invite
  -> POST /api/auth/registration-token
  -> optional GET /api/v1/user/presigned-upload-url
  -> optional PUT image to object storage
  -> optional PATCH /api/v1/user/avatar
  -> return to login
```

The registration hook uses `fetch` for this sequence, not the Axios proxy.
The invite code comes from `?invite=`. A missing or invalid code returns to login.
First name, last name, password and repeated password are required; passwords
must satisfy the shared password policy and match. Avatar accepts PNG/JPEG up to
10 MiB, is cropped to JPEG client-side, and is optional. Account creation remains
successful when avatar presign/upload/attach fails.

### Password recovery

```text
forgot form -> POST /api/auth/forgot-password
reset page -> GET /api/auth/verify-reset-token
reset form -> POST /api/auth/reset-password
```

## API flow inventory

| Trigger | Browser call | Actual destination | Source |
| --- | --- | --- | --- |
| Current user | `GET /api/users/me` | users controller -> `usersService` -> Neon | `(hooks)/use-me.ts` |
| Login | `POST /api/auth/login` | login controller -> `authService` -> Neon | `login/(hooks)/use-login-form.ts` |
| Forgot password | `POST /api/auth/forgot-password` | controller -> `/api/v1/auth/forgot-password` | `forgot-password/(hooks)/use-forgot-password-form.ts` |
| Verify reset | `GET /api/auth/verify-reset-token` | `/api/v1/auth/verify-reset-token` | `reset-password/(hooks)/use-verify-reset-token.ts` |
| Reset password | `POST /api/auth/reset-password` | `/api/v1/auth/reset-password` | `reset-password/(hooks)/use-reset-password-form.ts` |
| Verify invite | `POST /api/auth/verify-invite-user`, body `{code}` | controller -> `/api/v1/user/verify-invite-user` | `registration/(hooks)/use-verify-invite.ts` |
| Registration presign | `GET /api/v1/user/presigned-upload-url` | direct external API | `registration/(hooks)/use-registration-form.ts` |
| Registration upload | `PUT {presignedUrl}` | object storage | same hook |
| Set avatar | `PATCH /api/v1/user/avatar`, body `{avatar: key}` | direct external API | same hook |
| Accept invite | `POST /api/auth/accept-invite`, body invite code, identity and passwords | controller -> `/api/v1/user/accept-invite` | same hook |
| Registration token | `POST /api/auth/registration-token`, body email/password | controller -> `/api/v1/auth/login`; returns a short-lived access token for optional avatar upload | same hook |
| Refresh | `POST /api/auth/refresh-token` | refresh controller -> `authService.refresh` -> Neon | `src/lib/api.ts` |
| Socket token | `GET /api/auth/socket-token` | Next handler (reads AT cookie for Socket.IO/SSE) | `use-chat-socket.ts`, `use-notification-sse.ts` |
| Logout | `POST /api/auth/logout`, `PUT /api/clear-cookies` | controllers | `src/lib/api.ts` |

Important route handlers: `src/app/api/auth/{login,refresh-token,socket-token,logout,
forgot-password,accept-invite,registration-token,verify-invite-user}/route.ts`.

## State and cache

- Query keys: `["me"]`, `["verify-invite", invite]`,
  `["verify-reset-token", token]`.
- `useUserStore` is the application source for module navbar access, action permissions,
  profile and preferences. `role.navbar` controls module navigation; `role.permissions`
  drives route/component presentation guards. Backend authorization remains authoritative.
- Login error codes and attempts remaining are mapped in the Next login handler;
  preserve this behavior when changing response handling.
- Add new backend error codes to both `messages/en.json` and `messages/vi.json`.

`useMe()` maps profile data, `role.navbar`, and `role.permissions` into
`useUserStore`. The backend derives both lists from the persisted role. Missing
permission/navbar data maps to an empty list. Legacy user permission/navbar columns
no longer grant access. Dashboard and Settings are always visible on the client;
gated modules use `role.navbar`, and actions use permission keys through
`RouteGuard`/`ComponentGuard` or `useHasPermission`. These FE guards only control
presentation; APIs enforce their policies on the server. It also applies language,
appearance, currency and date format. The server's default currency is VND; migration
`20261104092115_normalize_saved_currency_preferences` converts every existing
user preference currency to VND. Currency preferences do not convert stored
business amounts.
The client falls back to `{ code: "VND", symbol: "₫" }` when the profile omits
currency. The private shell's `AppInitializer` loads the profile before normal
page rendering.
Failure is treated as an expired session and logs the user out.

## Development seed accounts

`pnpm db:seed` is restricted to `NEON_BRANCH=development` and refuses production. It
ensures one user exists for each built-in role. The super admin uses
`SEED_SUPER_ADMIN_EMAIL` and `SEED_SUPER_ADMIN_PASSWORD`; adult and child seed users use
`adult.seed@local.test` / `adult.seed@1234` and `child.seed@local.test` /
`child.seed@1234`. Adult/child users are created only when their role has no assigned
account. Existing user credentials and role assignments are left unchanged.

## Change checklist

Update route guard classification, cookie path/httpOnly settings, interceptor
auth-route exclusions, `useUserStore` mapping and both locale messages when
changing auth. Test success/failure login, reload, expired token, multi-tab logout,
invalid invite and invalid reset token. Status `203` must remain a successful
login with a password-change warning.
