# 00 — Vision and Concept

## Stack Snapshot

> **Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS v4 · shadcn · TanStack Query v5 · react-hook-form v7 · Zod v4 · next-intl v4 · nuqs v2 · Zustand v5**

---

## Architecture Overview

This application is a **multi-tenant, multi-locale enterprise dashboard** built as one
full-stack Next.js App Router app. Its UI is primarily client-rendered; its server-side
Route Handlers and domain modules live in this same repository. Existing external API
proxy routes remain during migration, while new first-party API modules use the same Next
runtime.

The app provides:

- **Tenant theming** — Each tenant ships its own CSS token set (brand colors, typography, radius) without touching component logic.
- **Locale-first routing** — Every URL carries an explicit locale prefix (`/vi/…`, `/en/…`). Vietnamese is the default locale.
- **URL-as-state** — All filter, pagination, and search state lives in the URL via `nuqs`, making every view deep-linkable and shareable.
- **Direct data layer** — Feature hooks call same-origin API routes via TanStack Query + Axios; Route Handlers either proxy the existing external API or call a first-party server module.
- **Consistent error contract** — Backend errors resolve to translated messages through the `errors` namespace in `messages/en.json` / `vi.json`.
- **Design system agnostic pages** — Features only consume semantic tokens and shared primitives, allowing instant theme swapping.

## Core Principles

| Principle | Implementation |
|---|---|
| Logic in hooks, rendering in components | Components contain only JSX; business logic lives in custom hooks |
| Single source of truth for URL state | nuqs `useQueryStates` — never `useState` for filters/pagination |
| Hooks own their API calls | No service indirection — a hook fetcher calls `apiProxy` directly |
| Max 200 lines per file | Enforced via code review and skill guidance |
| Dark-mode safe by default | Semantic color tokens only — no `.dark:` overrides in component files |
| React Compiler on | No manual `useMemo`, `useCallback`, or `memo` anywhere |

---

*Next: `01-ARCHITECTURE.md`.*
