# 03 — Auth and Authorization

## Token Model

| Token | Storage | Lifetime | Who sets it |
|---|---|---|---|
| Access Token (AT) | `accessToken` cookie (**httpOnly**, `samesite=lax`) | Short-lived (minutes) | Next.js route handler on login/refresh |
| Refresh Token (RT) | `refreshToken` cookie (**httpOnly**, `samesite=strict`) | Long-lived (days) | Next.js route handler on login/refresh |

Both the AT and RT are **never readable by JavaScript (`httpOnly: true`)** — this completely prevents XSS token theft. The browser automatically sends the cookies to Next.js route handlers (`/api/*`) via `withCredentials: true`. The Next.js catch-all proxy (`src/app/api/[...path]/route.ts`) reads the `accessToken` cookie on the server and attaches `Authorization: Bearer <AT>` before forwarding to the real backend.

## Route Guard (`src/proxy.ts`)

In Next.js 16, `proxy.ts` is the middleware entry point directly.

```
Incoming request
  ├── Path = "/"         → redirect to /{locale}/dashboards  (if AT/RT present)
  │                      → redirect to /{locale}/login       (if no AT/RT)
  ├── Path = "/login"
  │   └── AT/RT present  → redirect to /{locale}/dashboards
  ├── Protected segment  → no AT/RT → redirect to /{locale}/login
  └── Everything else   → pass to next-intl middleware (locale normalisation)
```

## Axios Interceptor Flow (`src/lib/api.ts`)

```
Request interceptor:
  1. Attach x-lang header (from URL path locale)
  2. Attach x-user-identifier (browser fingerprint)
  (Browser automatically sends httpOnly cookies to /api/* via withCredentials: true)

Response interceptor:
  1. Unwrap server envelope { status, message, error_code, data }
  2. If status >= 400 → resolve error_code via getErrorMessage() (errors i18n namespace)
     → show error toast → throw AxiosError
  3. If 401 on a request (reactive refresh):
     → call POST /api/auth/refresh-token once (Next.js server handles RT cookie & sets new AT cookie)
     → retry original request
  4. If refresh fails → clientLogout()

clientLogout():
  1. POST /api/auth/logout & PUT /api/clear-cookies → server clears all httpOnly auth cookies
  2. BroadcastChannel('auth').postMessage({ type: 'LOGOUT' })
  3. window.location.assign(/{locale}/login)
```

## Cross-Tab Coordination

`BroadcastChannel('auth')` synchronises all open tabs:

- `REFRESH_SUCCESS` — other tabs pick up the new AT
- `REFRESH_FAILURE` — all tabs log out together
- `LOGOUT` — all tabs redirect to login simultaneously

## Realtime & Socket Connections (`GET /api/auth/socket-token`)

For persistent connections that connect directly to the backend gateway (Socket.IO chat, SSE notification streams), client components obtain a short-lived token on-demand:

- Endpoint: `GET /api/auth/socket-token`
- Next.js server reads the httpOnly `accessToken` cookie and returns `{ data: { token } }`.
- Client uses this token to establish the Socket.IO connection (`query: { token }`) or SSE stream (`Authorization: Bearer <token>`).

## Axios Instances

| Instance | Export | Base URL | Use |
|---|---|---|---|
| `apiProxy` | named, only export | `/api` | Every API call — auth (login, refresh, clear-cookies, socket-token) and all other regular calls |

`apiProxy` always routes through the Next.js server (`/api`), never straight to the backend — see the API Client section in `CLAUDE.md` for how the catch-all proxy forwards by module.

```ts
import { apiProxy } from '@/lib/api-client';

export async function login(dto: LoginDto) {
  const { data } = await apiProxy.post<LoginResponse>('/auth/login', dto);
  return data;
}

// All other hooks → also call apiProxy
```

## Locale Sync (post-login locale redirect)

`useMe()` (`src/features/auth/(hooks)/use-me.ts`) fetches `/user/me` directly via `apiProxy` and applies the user's preferred language/appearance/permissions on load — no dedicated `<LocaleSync>` wrapper involved:

```tsx
async function fetchMe(): Promise<MeData> {
  const response = await apiProxy.get('/user/me');
  return response.data.data as MeData;
}

const query = useQuery({ queryKey: ['me'], queryFn: fetchMe });
// on query.data change: setLocale(data.settings.preferredLanguage), setTheme(...), etc.
```

---

*Next: `04-UI-COMPONENTS.md`.*
