# 06 — Integration

## API Calls — Direct from Hooks, Proxied Through the Next Server

```
Backend NestJS (internal network only)
  └── REST endpoint
        └── /api/[...path] catch-all route handler forwards server-side
              └── feature hook's fetcher() calls apiProxy
                    └── TanStack Query wraps it in useQuery / useMutation
```

There is no code-generation step between a hook and the endpoint it calls, and no direct browser-to-backend call — every request goes through the Next.js server, which forwards it to the backend over the internal network.

**Rules:**
- Define the fetcher inline at the top of the hook file; extract a `(services)/<name>-service.ts` only when the same fetcher is reused by multiple hooks
- No try/catch in the fetcher — the api client's response interceptor handles error toasts globally (see Error Handling below)

## Error Handling

The backend responds with `{ status, message, error_code, data }`. `error_code` is a stable machine key (e.g. `WRONG_PASSWORD`, `INVITATION_EXPIRED`).

- `getErrorMessage(error_code)` (`@/lib/get-error-message`) resolves it to a translated string from the **`errors`** namespace in `src/messages/en.json` / `de.json` (dots become underscores; falls back to `errors.default`)
- The `apiProxy` response interceptor calls this and fires `toast.error()` automatically on any 4xx/5xx — feature code never needs its own try/catch or toast for API errors
- **New backend `error_code` → add a matching key under `errors` in both `en.json` and `de.json`**

## TanStack Query

- All data fetching is CSR — no `fetch()` in Server Components for authenticated data
- Default options configured in `src/lib/query-config.ts`
- Cache invalidation via `queryClient.invalidateQueries()` in mutation `onSuccess`
- `queryKey` arrays include URL filter params so nuqs URL changes trigger automatic refetches

## URL State → Data Flow

```
nuqs setFilters(...)
  → URL: ?page=2&search=foo
  → queryKey: ['users', { page: 2, search: 'foo' }]
  → TanStack Query: cache miss → fetch
  → hook's fetcher → apiProxy → /api → Next.js proxy → backend
  → component re-renders
```

`shallow: true` (nuqs default) — URL updates via `history.pushState` without a full navigation. TanStack Query still refetches because `queryKey` changes — not because of a navigation event.

**Why nuqs?** In a standard React app, updating a search input calls `setState`, re-renders the component, and then (asynchronously) updates the URL. With nuqs, the URL is updated synchronously on every keystroke via `history.pushState`. The input feels instant because the param is in the URL before the next paint — no perceptible lag.

## Form Integration

| Layer | Location | Responsibility |
|---|---|---|
| Zod schema | `(helpers)/<feature>-schema.ts` | Validation rules + TS types |
| Form hook | `(hooks)/use-<name>-form.ts` | `useForm`, `zodResolver`, submit handler, mutation |
| Component | `(components)/<name>-form.tsx` | Renders fields only, no logic |
| Child fields | use `useFormContext()` | For complex multi-step or decomposed forms |

Validation messages reference i18n keys resolved at runtime — no hardcoded strings in zod schemas.

## Zustand (Global State)

Used for application-level state that does not belong in the URL or server cache (e.g., sidebar state, user preference overrides, cross-feature event bus). Stores live in `src/shared/stores/`.

## Date & Time

All timestamps in the DB are stored as **UTC+0**, but the stored value **is** Germany local time — the server applies no offset (e.g. "14:00 Germany time" is stored as `14:00Z`).

```ts
import { formatDate, nowUtc, toApiDate } from '@/lib/date-utils';
import { useDateFormat } from '@/shared/stores/use-user-store';

const dateFormat = useDateFormat(); // from user preferences store

// ✅ Display a DB date — always use formatDate with the user's format
formatDate(dbDate, dateFormat)           // date only  → "04/06/2026"
formatDate(dbDate, dateFormat, true)     // with time  → "04/06/2026 14:00"

// ✅ Current time
nowUtc()

// ✅ Serialize for API
toApiDate(pickedDate)

// ❌ Never hardcode format strings — dayjs.utc(x).format('DD/MM/YYYY HH:mm')
// ❌ Never use bare dayjs(), new Date(), or .toISOString()
```

---

*Next: `07-MODULE-WIDGET-SYSTEM.md`.*
