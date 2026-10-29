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
  -> Next route validates captcha and calls upstream /api/v1/auth/login
  -> Next route calls upstream /api/v1/user/me for language/theme
  -> cookies are set (access, refresh, locale, appearance)
  -> private layout mounts AppInitializer
  -> GET /api/user/me
  -> useUserStore receives profile, permissions and settings
  -> dashboard/app renders
```

The access token and refresh token are both httpOnly.
Browser JavaScript cannot read tokens directly. `src/app/api/[...path]/route.ts`
reads the `accessToken` cookie on the server and attaches `Authorization: Bearer <token>`
when proxying to the backend. `src/lib/api.ts` handles token refresh reactively
upon receiving a 401 error. Failed refresh clears cookies, broadcasts `LOGOUT`
over `BroadcastChannel("auth")`, and redirects to the locale login page.

Login rules:

- Email must be valid; password is required and has a six-character client-side
  minimum.
- The client waits up to five seconds for reCAPTCHA v3, executes action `login`,
  and does not submit without a token.
- The Next handler validates captcha before forwarding email, password and
  `rememberMe` to core.
- Core's wrong-password response is normalized to `WRONG_PASSWORD` plus the live
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
- Locale and appearance are fetched from `/user/me` during login; invalid/missing
  values fall back to `de` and `light`.
- Reactive refresh handles expired access tokens on 401 status. Concurrent requests
  wait on the same refresh queue.
- Failed GET requests are retried once after successful refresh.
- Logout is best-effort against core, always clears local/server cookies via Next.js
  endpoints, broadcasts `LOGOUT`, then performs a full redirect to the locale login page.

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
| Current user | `GET /api/user/me` | external API `/api/v1/user/me` | `(hooks)/use-me.ts` |
| Login | `POST /api/auth/login` | Next handler -> `/api/v1/auth/login` | `login/(hooks)/use-login-form.ts` |
| Forgot password | `POST /api/auth/forgot-password` | Next handler -> `/api/v1/auth/forgot-password` | `forgot-password/(hooks)/use-forgot-password-form.ts` |
| Verify reset | `GET /api/auth/verify-reset-token` | `/api/v1/auth/verify-reset-token` | `reset-password/(hooks)/use-verify-reset-token.ts` |
| Reset password | `POST /api/auth/reset-password` | `/api/v1/auth/reset-password` | `reset-password/(hooks)/use-reset-password-form.ts` |
| Verify invite | `POST /api/auth/verify-invite-user`, body `{code}` | Next handler -> `/api/v1/user/verify-invite-user` | `registration/(hooks)/use-verify-invite.ts` |
| Registration presign | `GET /api/v1/user/presigned-upload-url` | direct external API | `registration/(hooks)/use-registration-form.ts` |
| Registration upload | `PUT {presignedUrl}` | object storage | same hook |
| Set avatar | `PATCH /api/v1/user/avatar`, body `{avatar: key}` | direct external API | same hook |
| Accept invite | `POST /api/auth/accept-invite`, body invite code, identity and passwords | Next handler -> `/api/v1/user/accept-invite` | same hook |
| Registration token | `POST /api/auth/registration-token`, body email/password | Next handler -> `/api/v1/auth/login`; returns a short-lived access token for optional avatar upload | same hook |
| Refresh | `POST /api/auth/refresh-token` | Next handler -> `/api/v1/auth/refresh-token` | `src/lib/api.ts` |
| Socket token | `GET /api/auth/socket-token` | Next handler (reads AT cookie for Socket.IO/SSE) | `use-chat-socket.ts`, `use-notification-sse.ts` |
| Logout | `POST /api/auth/logout`, `PUT /api/clear-cookies` | Next handlers | `src/lib/api.ts` |

Important route handlers: `src/app/api/auth/{login,refresh-token,socket-token,logout,
forgot-password,accept-invite,registration-token,verify-invite-user}/route.ts`.

## State and cache

- Query keys: `["me"]`, `["verify-invite", invite]`,
  `["verify-reset-token", token]`.
- `useUserStore` is the application source for permissions, profile and
  preferences.
- Login error codes and attempts remaining are mapped in the Next login handler;
  preserve this behavior when changing response handling.
- Add new backend error codes to both `messages/en.json` and `messages/de.json`.

`useMe()` maps profile data into `useUserStore`, preferring top-level
`permissions` over `role.permissions`, and maps missing permissions/navbar to an
empty array. It also applies language, appearance, currency and date format.
Failure is treated as an expired session and logs the user out.

## Change checklist

Update route guard classification, cookie path/httpOnly settings, interceptor
auth-route exclusions, `useUserStore` mapping and both locale messages when
changing auth. Test success/failure login, reload, expired token, multi-tab logout,
invalid invite and invalid reset token. Status `203` must remain a successful
login with a password-change warning.
