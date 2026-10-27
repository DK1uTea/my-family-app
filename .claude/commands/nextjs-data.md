# Data Fetching Patterns

TanStack Query v5 + the project's api client. Hooks call the API directly — no code-generation layer.

## The Pattern

Every feature hook owns its own fetcher — no generated layer, no service layer by default. Extract a `(services)/<name>-service.ts` only when the same fetcher is reused by multiple hooks.

## Which Client to Use

`src/lib/api-client.ts` exports a single instance, `apiProxy` (baseURL `/api`) — use it for every hook, including auth. It routes through a dedicated Next.js route handler or the catch-all proxy (`src/app/api/[...path]/route.ts`), which forwards server-side to the real backend. There is no direct-to-backend client — the backend is only reachable from the Next server, not from the browser.

## Auth Fetcher Template

Auth endpoints that set/read httpOnly cookies also go through `apiProxy`:

```ts
import { apiProxy } from '@/lib/api-client';

async function login(dto: LoginDto) {
  const { data } = await apiProxy.post<LoginResponse>('/auth/login', dto);
  return data;
}

async function logout() {
  await apiProxy.put('/clear-cookies'); // or use clientLogout() from api-client
}
```

## Fetcher + Query Hook Template (default pattern)

```ts
// (hooks)/use-user-data.ts
'use client';
import { useQuery } from '@tanstack/react-query';
import { apiProxy } from '@/lib/api-client';

export type User = { id: string; name: string; email: string };
export type UserFilters = { page: number; perPage: number; search: string };

function cleanParams<T extends Record<string, unknown>>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  ) as Partial<T>;
}

async function getUsers(filters: UserFilters) {
  const { data } = await apiProxy.get<PaginatedResponse<User>>('/users', {
    params: cleanParams(filters),
  });
  return data;
}

export function useUserData(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
  });
}
```

## Mutation Hook Template

```ts
// (hooks)/use-user-actions.ts
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiProxy } from '@/lib/api-client';

async function createUser(dto: CreateUserDto) {
  const { data } = await apiProxy.post<User>('/users', dto);
  return data;
}
async function deleteUser(id: string) {
  await apiProxy.delete(`/users/${id}`);
}

export function useUserActions() {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: createUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
  return { create, remove };
}
```

## Error Handling

Backend responses are `{ status, message, error_code, data }`. The api client's response interceptor already resolves `error_code` via `getErrorMessage()` (`@/lib/get-error-message`, reading the **`errors`** namespace of `en.json`/`de.json`) and fires `toast.error()` automatically — **no try/catch or manual toasts in hooks/services**. New backend `error_code` → add a key under `errors` in both `en.json` and `de.json`.

## Key Rules

- CSR only — always `'use client'` + `useQuery`
- No try-catch in hooks/services — apiProxy interceptor handles errors
- Return `data` directly — destructure `{ data }` from Axios response
- No `(types)/` folder — types inline at top of hook file
- Invalidate on mutations in `onSuccess`
- HTML entity conversion is shared: import `escapeHTML` / `unescapeHTML` from `@/lib/html` when mapping API text or preparing user text for HTML contexts; never duplicate local helpers in feature hooks/services.
