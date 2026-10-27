# Next.js Boilerplate — Claude Code Rules

> **Two rules override everything below.**
>
> 1. **QA owns every test case; dev owns implementation only.** If you are doing dev work, never create, edit, or delete a `*.test.ts(x)` or `*.spec.ts` file — implement against `docs/specs/<module>.md` and flag anything wrong with an existing test back to QA. If you are doing QA/test work, never edit a file under `src/` — write/update the test case instead. → [`.claude/skills/test-driven-development/SKILL.md`](.claude/skills/test-driven-development/SKILL.md)
> 2. **Every rule change fans out to every agent's rule file, in the same change.** A rule that only lands in `CLAUDE.md` is a rule Copilot and Cursor users will violate. → [`.claude/skills/agent-rules-sync/SKILL.md`](.claude/skills/agent-rules-sync/SKILL.md)

---

## Agent Rules Sync — Read Before Editing Any Rule

The team uses different AI agents. **When you add, change or delete a rule, convention, skill, npm script or MCP server, you MUST update every file below in the same change** — never in a follow-up commit.

| File | Read by | Role |
| ---- | ------- | ---- |
| `CLAUDE.md` | Claude Code | **Canonical** — the full rule set |
| `.github/copilot-instructions.md` | GitHub Copilot (VS Code + github.com) | Full mirror — may compress prose, must never omit or contradict a rule |
| `AGENTS.md` | Cursor, Codex, Gemini CLI, Copilot agent mode | Short pointer to the canonical files |
| `.claude/skills/<name>/SKILL.md` | Any agent, referenced by path | Deep-dive procedures — **one copy, never mirrored** |
| `.omc/skills/<name>/SKILL.md` + `.claude/commands/<name>.md` | OMC / slash commands | Mirrored pair — update both |
| `.mcp.json` + `.vscode/mcp.json` | Claude Code / VS Code | Same MCP servers, two schemas — update both |

Before ending a turn that touched a rule: grep the new wording across `CLAUDE.md`, `.github/copilot-instructions.md` and `AGENTS.md`, then list every file you touched. Full protocol, routing table and red flags in [`.claude/skills/agent-rules-sync/SKILL.md`](.claude/skills/agent-rules-sync/SKILL.md).

---

## Workflow — SPEC → DEV/QA (parallel) → VERIFY → SYNC

Non-trivial work follows this route. The map lives in [`.claude/skills/feature-workflow/SKILL.md`](.claude/skills/feature-workflow/SKILL.md); read it when you are unsure which stage applies.

**Test authorship is not a dev step.** Dev implements against the approved spec and never
touches a test file. QA writes and maintains every test case — unit/component and E2E — and
never touches a file under `src/`. The two work in parallel off the same spec, not one after
the other. Full split, including "which role am I": [`.claude/skills/test-driven-development/SKILL.md`](.claude/skills/test-driven-development/SKILL.md).

| Stage | Skill | Gate before advancing |
| ----- | ----- | --------------------- |
| **SPEC** | `spec-driven-development` | Human approved `docs/specs/<feature>.md` |
| **DEV** (parallel with QA) | `test-driven-development` | `pnpm test`, `pnpm typecheck`, `pnpm lint` pass against existing QA test cases |
| **QA** (parallel with DEV) | `test-driven-development`, `e2e-module-testing` | Every behaviour bullet has a test case that failed for the right reason first |
| **VERIFY** | `browser-verification-playwright` | Console clean, both locales, `pnpm test:e2e` passes |
| **SYNC** | `agent-rules-sync` | Every mirrored file updated and listed |

**Entry point by request type** — bug report → QA reproduces it first, dev fixes it against the report; requirement change → QA updates the test encoding the old behaviour, dev updates the implementation; visual-only restyle → start at VERIFY; new feature or module → start at SPEC, then dev and QA proceed in parallel.

---

## Business Context Is Part of the Contract

Every top-level feature under `src/features/<feature>/` MUST own a
`CONTEXT.md`. It is the durable source of truth for that feature's business
rules, routes and permissions, validation, state/status transitions, API
methods and payloads, side effects, cache invalidation, navigation, and known
limitations.

Before changing business behaviour or an API contract, read the affected
feature's `CONTEXT.md`. Update it in the same change whenever any documented
behaviour changes. A new top-level feature is incomplete without its
`CONTEXT.md`.

Never infer an ambiguous business meaning from UI labels or endpoint names.
Inspect the implementation and tests first; if the intended meaning still
cannot be proven, ask the human and record the confirmed answer in
`CONTEXT.md`. Context documents support specs and tests; they do not replace
the RED-to-GREEN workflow.

---

## Testing — Mandatory, Owned by QA

**QA owns every test case — unit/component (Vitest) and E2E (Playwright) alike.** Dev
implements against `docs/specs/<module>.md` and never creates, edits, or deletes a test
file; QA never edits a file under `src/`. Every behaviour change still requires a failing
test first — it is just QA's test, not dev's. No exceptions unless the human explicitly
says to skip. Full rules, including the role split, in [`.claude/skills/test-driven-development/SKILL.md`](.claude/skills/test-driven-development/SKILL.md).

| Kind | Location | Extension | Runner |
| ---- | -------- | --------- | ------ |
| Unit / component | `tests/`, mirroring the `src/` tree | `*.test.ts` / `*.test.tsx` | Vitest + jsdom + React Testing Library |
| E2E | `e2e/modules/<module>/` | `*.spec.ts` | Playwright |

The two extensions are distinct on purpose — neither runner picks up the other's files.

**`src/` holds source only.** No test file sits next to the code it covers — a unit or component test mirrors the source path under `tests/`, so `src/features/x/y.ts` is tested by `tests/features/x/y.test.ts`. Browsing a feature folder shows the feature and nothing else. Tests import through the `@/` alias, never a relative path back into `src`.


```bash
pnpm test                 # unit + component suite
pnpm test:watch           # watch loop while working
pnpm test tests/lib/utils.test.ts   # one file
pnpm test tests/lib      # one folder
pnpm test -t "test name"  # one test
pnpm test:coverage        # coverage report

pnpm test:e2e             # every module (boots the dev server itself)
pnpm test:e2e login       # one module — the folder name is the filter
pnpm test:e2e login/validation   # one aspect of one module
pnpm test:e2e:ui login    # Playwright UI, filtered to that module
pnpm test:e2e:headed login       # watch a real browser run it
pnpm test:e2e:debug login        # step through with the inspector
pnpm test:e2e:a11y        # every module's a11y.spec.ts
pnpm test:e2e:report      # open the last HTML report
pnpm e2e:new <module>     # scaffold a module folder (--public for no-auth pages)

pnpm test:all             # everything
pnpm typecheck            # tsc --noEmit
pnpm lint                 # eslint
```

**Test these:** zod schemas, `(helpers)/*-mapper.ts` (especially the null / `{}` defensive guards), `(helpers)/*-constants.ts` lookups, everything in `src/lib/`, and component behaviour (disabled states, conditional rendering, empty states).
**Do not test:** skeletons, Tailwind classes, or third-party library behaviour.

`tests/setup.ts` already stubs `matchMedia`, `ResizeObserver`, `IntersectionObserver` and the pointer-capture APIs Radix needs, and runs RTL `cleanup()` after each test.

### E2E — One Spec File Per Business Flow, `data-testid` Locators, Owned by QA

Layout and the "spec's happy path → QA writes one spec file per business flow" workflow are owned by [`.claude/skills/e2e-module-testing/SKILL.md`](.claude/skills/e2e-module-testing/SKILL.md). Read it before creating any spec file. **Only QA creates or edits files under `e2e/modules/`** — dev runs `pnpm test:e2e <module>` to self-check but never authors a spec.

```
e2e/
├── shared/                        # cross-module harness — no specs here
│   ├── session.ts                 # signIn / authenticateViaApi / resumeSessionAt / MODULES
│   ├── console.ts                 # watchConsole().assertClean()
│   └── a11y.ts                    # scanA11y() — axe scan, contrast rule exempt
└── modules/<module>/              # folder name MUST match the route segment
    ├── <module>.page.ts           # page object: data-testid locators
    ├── <module>.data.ts           # credentials (from env) + minimal expected copy
    └── <flow-name>.spec.ts        # one file per distinct business flow — e.g.
                                    # create-event.spec.ts, edit-event.spec.ts
```

**Every business flow the module owns gets its own mandatory spec file, named after the flow — never `flow.spec.ts`.** A module with one flow (e.g. `login` — only "sign in") gets one file; a module whose UI genuinely branches into separate journeys (e.g. `events` — create is a fresh wizard, edit hydrates an existing record) gets one file per journey. This is a small team optimizing for locking down working business behaviour with the least maintenance burden, not exhaustive UI coverage — field-level validation and mapper guards belong in Vitest unit tests instead. `content.spec.ts` / `validation.spec.ts` / `errors.spec.ts` / `routing.spec.ts` / `a11y.spec.ts` are optional: write one only when a specific branch genuinely needs a real-browser guard beyond what a unit test already proves. **Locators use `page.getByTestId('<name>')` against a `data-testid` attribute, not role/text** — role/text locators broke in practice when rendered copy or structure (language, an added iframe) drifted independently of the underlying feature. Adding a missing `data-testid` is a `src/` change for dev, not a QA edit, unless a manager explicitly authorizes crossing that line.

**The folder name is the filter** — `pnpm test:e2e login` is `playwright test login`, a path substring match. Name the folder after the route segment or the module becomes unrunnable on its own. No specs at the `e2e/` root or in `e2e/shared/`.

**Each flow spec is self-sufficient** — Playwright runs spec files independently and in any order, so a flow spec must create whatever data/state it needs itself rather than assuming another spec file already created it. Every flow spec authenticates via `resumeSessionAt`, except `login`'s own flow spec, which is the one place the real UI form is exercised on purpose.

**One flow spec file = one `test()`, named after the flow** — `test('create event', ...)`, not a `describe` split into a sign-in test, an unauthenticated-visitor test, and a "does the thing" test. Authenticating via `resumeSessionAt` is the first line of that one test, not a separate test. Keep the test name short and generic (`'create event'`, `'edit event'`) — not a sentence describing every step; the file name already says which flow it is.

**Only `login`'s own flow spec walks the real login form.** Every other module's flow spec authenticates via `resumeSessionAt` (a direct API call) — never `signIn` (the UI form). The login form's own locale/redirect behavior is unrelated to what any other module's flow is testing, and rendering it first only adds time and a second source of flakiness.

Describe a module in `docs/specs/<module>.md` (template: `docs/specs/_TEMPLATE.module.md`) and group the happy-path "Behaviour" bullets by flow — each group becomes one spec file's test names. Scaffold with `pnpm e2e:new <module>`.

**Every spec hits the real backend — there is no `page.route()` mocking.** This only works because `SKIP_CAPTCHA_VERIFICATION=true` (see `src/lib/verify-captcha.ts`) is double-gated behind `NODE_ENV !== 'production'` and set in `.env.local`: the frontend still executes reCAPTCHA v3 and sends a token, but the backend's score check is skipped, so a headless browser's low bot-likelihood score never gets a real, correct login rejected. A branch a fresh sign-in cannot reach (a locked account, an inactive account, one restricted to specific modules) needs a **dedicated real test account** supplied via `.env.local` (see `.env.example`), read through `lockedCredentials()` / `inactiveCredentials()` / `restrictedCredentials()` in `e2e/shared/session.ts` — each returns `null` when unconfigured, and the test skips itself with a stated reason rather than fail or fall back to a fixture. **Accepted risk:** a wrong-password test spends one of the real five attempts the backend tracks and can lock the account after five in a row — that is the trade-off of a real backend, not a bug to fix.

### E2E Scenarios — Observe First, Then Assert

**Never write a UI scenario from what you assume the page does.** Open it with the Playwright MCP browser, read the accessibility tree and the real response bodies, then assert what you saw. Full recipe in [`.claude/skills/browser-verification-playwright/SKILL.md`](.claude/skills/browser-verification-playwright/SKILL.md); reference implementation: `e2e/modules/login/`.

- **Locators live in a page object**, one per module, using `page.getByTestId('<name>')` against a `data-testid` — not role/text. When markup, copy, or structure changes, one file changes and the locator itself keeps working. Add a missing `data-testid` in `src/` as a dev change, not a QA edit, unless explicitly authorized otherwise. Full rationale: [`.claude/skills/e2e-module-testing/SKILL.md`](.claude/skills/e2e-module-testing/SKILL.md).
- **Read server-driven values from the response, don't hardcode them** — an attempts-remaining count or lockout duration should come from `page.waitForResponse(...)`'s actual body, asserted against dynamically, not a guessed fixed number.
- **`src/app/api/auth/*` always answers HTTP 200** and carries the real status inside the envelope; `unwrapEnvelope()` in `src/lib/api.ts` throws off that field.
- **Locale comes from cookies, not the URL.** `src/proxy.ts` reads `preferredLanguage` then `NEXT_LOCALE`, defaults to `de`, and rewrites any path whose prefix disagrees — `/en/login` without a cookie lands on `/de/login`. Set it with `setLocaleCookie` in `e2e/shared/session.ts`.
- **E2E is local-only and has no CI job — run `pnpm test:e2e` yourself before pushing.** Two reasons, either one sufficient: the captcha bypass in `src/lib/verify-captcha.ts` is double-gated on `NODE_ENV !== 'production'`, so it only works against `pnpm dev` (a CI job that built the app would have every sign-in rejected with `400 Captcha verification failed` — measured: it would reject requests); and specs create, mutate and delete real Events through one shared real account, so two concurrent runs fight over it. `playwright.config.ts` therefore carries no CI branches, and **the `pnpm build && pnpm start` idea is closed — do not reintroduce it.**
- **Local runs are capped at `workers: 2`.** Playwright's default is half your CPU cores; on a 16-core machine those 8 workers all paid `next dev`'s first-request route compile at once and starved data-dependent UI — a page's static shell rendered while its form body rendered nothing, so specs failed on controls that existed but never became enabled. Measured: 8 workers → 5 failed in 1.8min; 2 → 0 failed in 2.7min; 1 → 0 failed in 4.4min. `expect.timeout` is 10s to absorb the compile.

**Testing a module behind auth** — a module spec starts the way a user does, so it covers the guard chain and the shell, not just the page. Harness: `e2e/shared/session.ts`; reference: `e2e/modules/user-settings/`.

```ts
await signIn(page);                      // fills the real login form, waits for /de/dashboards
await openModule(page, 'userSettings');  // clicks the sidebar entry, waits for the route
await resumeSessionAt(page, 'events');   // real POST /api/auth/login via page.request, then straight to the page
```

- `signIn` costs ~4s per test (real UI form submit), `resumeSessionAt` ~1.5s (`authenticateViaApi` POSTs directly; Playwright's `page.request` shares its cookie jar with the browser context, so the real `Set-Cookie` response is already applied before `page.goto()`). Walk the journey once per module, use the fast path for the rest.
- **Permissions trap**: `use-me.ts` does `setPermissions(permissions ?? role?.permissions ?? [])` / `setNavbar(role?.navbar ?? [])`, and the stores read `null` as "allow everything" but `[]` as "allow nothing". A real account whose role genuinely has no `navbar` entries shows only the `alwaysShow` sidebar entries — that's the app working correctly. Use `restrictedCredentials()` (a real account + its expected visible-module list from `E2E_RESTRICTED_USER_MODULES`) to test gating deliberately.
- **Scope sidebar locators** with `sidebarLink(page, name)` — the breadcrumb renders the current page as `<span role="link">DASHBOARDS</span>`, so an unscoped `getByRole('link', …)` is a strict-mode violation.

**Skip test-case authorship only for:** copy/translation-key edits, Tailwind-only restyles with no behaviour change, config, docs, and dependency bumps — and say that you skipped it and why. Everything else that changes behaviour needs a QA test case, present or explicitly pending.

---

## Accessibility — Mandatory

**Every interactive element you generate must be usable by keyboard and by screen reader.** Full rules in [`.claude/skills/accessibility/SKILL.md`](.claude/skills/accessibility/SKILL.md); reference implementation in `login-form.tsx`, guarded by `e2e/modules/login/a11y.spec.ts`.

- **A placeholder is not a label.** Every input/textarea/select needs a real `<label htmlFor>` + matching `id`. Use `required` for mandatory fields and mark the visual asterisk `aria-hidden="true"`.
- **Icon-only buttons need `aria-label`**, and it changes with state (`aria-pressed`, `aria-expanded`).
- **Never `tabIndex={-1}`** on something the user must operate.
- **Never `outline-none`** without a `focus-visible:` replacement.
- **Errors must be linked and announced** — `aria-describedby` → a `role="alert"` node, plus `aria-invalid` on the control. `Input` wires this automatically from its `error` prop; `InputGroup` needs `errorId` passed and set as `aria-describedby` on the control inside.
- **Colour contrast is NOT enforced — do not fix it, test it, or report it.** Every colour and border comes from the per-tenant theme (`src/styles/themes/<tenant>.css`), configured by design to match an approved brand; the palette is a design decision, not a code one. `scanA11y` (`e2e/shared/a11y.ts`) disables axe's `color-contrast` rule for every scan repo-wide — never re-enable it, never add a per-spec exception, never assert a contrast ratio, and never change a colour/opacity/border token to raise contrast. This is the **only** blanket a11y exemption; `.disableRules()` may never be used for anything else.
- **`<html lang>` must match the locale** — `src/app/layout.tsx` reads the `NEXT_LOCALE` cookie.
- New `aria-label` strings are i18n keys — add to `en.json` **and** `de.json`.

**Enforcement is a ratchet.** `eslint-plugin-jsx-a11y` recommended runs at `warn` (≈78 pre-existing violations across 39 files would otherwise block every commit); rules already at zero run at `error`; `src/features/auth/**` runs everything at `error`. **Never add a new violation of a warn-level rule** — warn means legacy debt, not optional. When a rule reaches zero repo-wide, promote it to `error` in `eslint.config.mjs`.

Runtime checks use `@axe-core/playwright` via `scanA11y` (`e2e/shared/a11y.ts`). Scan twice — clean, and with validation errors on screen. Apart from the standing `color-contrast` theme exemption baked into `scanA11y`, never `.disableRules()` to get green.

---

## MCP Servers

| Server | Declared in | Purpose |
| ------ | ----------- | ------- |
| `playwright` | `.mcp.json` (Claude Code) + `.vscode/mcp.json` (VS Code / Copilot) | Drive a real browser to reproduce, inspect and verify UI changes |

Both run `npx -y @playwright/mcp@latest --isolated --browser chrome`. The dev server is **not** started for you in an MCP session — run `pnpm dev` first and drive `http://localhost:3000`. Every path needs its locale prefix (`/de/login`). Workflow in [`.claude/skills/browser-verification-playwright/SKILL.md`](.claude/skills/browser-verification-playwright/SKILL.md).

Adding a new MCP server means editing **both** `.mcp.json` and `.vscode/mcp.json`.

---

## Stack

| Layer         | Library                                                              |
| ------------- | -------------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Turbopack, **React Compiler ON**)            |
| Language      | TypeScript 5, React 19                                               |
| Styling       | Tailwind CSS v4 + shadcn (radix-nova style)                          |
| Data fetching | TanStack Query v5 + Axios — hooks call the API directly |
| Forms         | react-hook-form v7 + zod v4                                          |
| i18n          | next-intl v4 (locales: `en`, `de`, default `de`, **URL prefix**)     |
| URL state     | **nuqs** v2 (`useQueryStates`, `useQueryState`)                      |
| Global state  | zustand v5                                                           |
| Icons         | lucide-react + custom SVG icons in `src/shared/components/common/icons/` |
| Theme         | next-themes (`attribute="class"`, default `dark`)                    |
| Unit tests    | **Vitest** v4 + jsdom + React Testing Library (`tests/**/*.test.ts(x)`) |
| E2E tests     | **Playwright** (`e2e/**/*.spec.ts`) + Playwright MCP for live verification |

---

## Skills

**Workflow skills** live in `.claude/skills/<name>/SKILL.md` — one copy, referenced by path from every agent's rule file.

| Skill                              | When to invoke                                                        |
| ---------------------------------- | --------------------------------------------------------------------- |
| `feature-workflow`                 | **Start here** for any non-trivial work — the SPEC→RED→GREEN→VERIFY→SYNC map |
| `spec-driven-development`          | New feature/module, vague requirements, multi-file or architectural change |
| `test-driven-development`          | **Any behaviour change** — new logic, bug fix, requirement change      |
| `e2e-module-testing`               | **Any Playwright spec** — the folder-per-module layout, and turning a module spec into test cases |
| `browser-verification-playwright`  | UI change, visual bug, console/network inspection — how to learn what to assert |
| `accessibility`                    | **Any interactive JSX** — labels, names, keyboard, focus, contrast    |
| `agent-rules-sync`                 | **Any rule, skill, script or MCP change** — fans it out to every agent |
| `nextjs-new-module`                | New top-level sidebar entry (read it in full, follow it in order)     |

**Pattern skills** live in `.omc/skills/` and are mirrored as Claude Code slash commands in `.claude/commands/` — update both copies together.

| Skill              | When to invoke                               |
| ------------------ | -------------------------------------------- |
| `nextjs-component` | Creating any React component                 |
| `nextjs-feature`   | Scaffolding a new feature end-to-end         |
| `nextjs-data`      | TanStack Query hooks that call the API directly |
| `nextjs-form`      | Forms with react-hook-form + zod             |
| `nextjs-url`       | URL state, filters, pagination, deep linking |
| `nextjs-i18n`      | Adding/updating translation keys             |
| `nextjs-colors`    | Working with color tokens                    |
| `nextjs-button`    | Button variants and sizes                    |
| `nextjs-tab`       | URL-synced tab navigation                    |

**Creating a brand-new top-level module** (new sidebar entry with its own icon, route, feature folder, and optional permission gate) — **MUST read `.claude/skills/nextjs-new-module/SKILL.md` first** and follow it exactly, in order. It covers `permissions.ts` wiring, icon creation, `app-sidebar.tsx` registration, `RouteGuard` usage, and the feature/page scaffold — steps `nextjs-feature` alone does not cover.

---

## Critical Import Rules

```ts
// ✅ ALWAYS use these
import { Link, useRouter, usePathname } from '@/i18n/navigation';
import { apiProxy } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/get-error-message';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { useQueryStates, useQueryState, parseAsString, parseAsInteger } from 'nuqs';

// ❌ NEVER import from next/navigation directly
import { useRouter } from 'next/navigation'; // WRONG
```

---

## React 19 / Next.js 16 Rules

- **No `useMemo`, `useCallback`, `memo`** — React Compiler handles optimization automatically
- **No `forwardRef`** — pass `ref` as a regular prop
- **No `<Context.Provider>`** — use `<Context>` directly as provider
- **No custom React Context for app state** — when two subtrees need to share state that a prop chain can't reach (e.g. a form tab and a shared footer bridging validation), use a **zustand** store instead of `createContext`/`useContext`. `FormProvider` from react-hook-form is the one exception — it's the library's own mechanism for exposing form state to nested field components, not app state. See `use-scoring-validator-store.ts` in `activation-detail/(hooks)` for the canonical bridging pattern.
- **Use `useEffectEvent`** for non-reactive logic inside `useEffect`
- **Use `useOptimistic`** for optimistic UI updates
- **Use `use()`** API for reading promises or context
- **Async page params**: `const { id } = await params` (not `params.id` directly)
- **Middleware**: logic in `src/proxy.ts`, re-exported from `src/middleware.ts`

---

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── api/                          # API route handlers (proxy to backend)
│   ├── [locale]/                     # All routes wrapped in locale segment
│   │   ├── layout.tsx                # NextIntlClientProvider + ReactQuery + NuqsAdapter
│   │   ├── (auth)/                   # Unauthenticated pages
│   │   │   └── login/page.tsx
│   │   └── (private)/                # Authenticated pages + shared layout
│   │       ├── layout.tsx            # LocaleSync (redirects to user's locale)
│   │       ├── _components/locale-sync.tsx
│   │       └── dashboard/page.tsx
│   ├── layout.tsx                    # Minimal root: html, body, fonts
│   └── globals.css                   # Tailwind + @font-face + CSS tokens
├── features/<name>/                  # Feature-based modules
│   ├── (helpers)/                    # Zod schemas (forms only)
│   ├── (services)/<name>-service.ts
│   ├── (hooks)/use-<name>-data.ts, use-<name>-actions.ts, use-<name>-filters.ts
│   └── (components)/<name>-main.tsx, <name>-main-skeleton.tsx
├── i18n/
│   ├── routing.ts                    # defineRouting (locales, defaultLocale, localePrefix)
│   ├── request.ts                    # getRequestConfig — reads requestLocale from [locale]
│   └── navigation.ts                 # createNavigation — locale-aware Link, useRouter, usePathname
├── lib/
│   ├── api-client.ts                 # Axios instances + error toasts + locale-aware 401 redirect
│   ├── get-error-message.ts          # Resolves BE error_code → translated string (errors namespace)
│   ├── query-config.ts
│   └── utils.ts                      # cn()
├── messages/
│   ├── en.json
│   └── de.json
├── middleware.ts                     # Re-exports from src/proxy.ts (Next.js entry point)
├── proxy.ts                          # Middleware logic: auth guards, locale redirects
└── shared/
    ├── components/
    │   ├── icons/                    # One file per icon, re-exported from index.tsx
    │   └── ui/                       # shadcn primitives + TabsUrl
    ├── constants/
    ├── hooks/
    │   └── common/                   # Shared hooks used across features
    ├── providers/                    # ReactQueryProvider, ToastProvider
    ├── services/
    ├── stores/
    └── types/
```

### Feature Scoping

- New components go **inside the feature** (`src/features/<name>/(components)/`)
- Move to `src/shared/components/` only when **3+ features** use the same component
- Sub-features: nested regular folders (no parentheses) inside the feature folder
- **Feature-scoped constants → one dedicated file in `(helpers)`** — enum-like values used across a feature's sub-features (e.g. CAM's activation status, its transition graph, i18n-key/badge-variant lookups) must live in a single file such as `src/features/<name>/(helpers)/<name>-constants.ts`, not be redefined ad hoc in whichever component happens to need them. If two+ sub-features would otherwise each hardcode their own copy of the same lookup table, that's the signal to centralize. Put it at the shallowest `(helpers)` folder that covers every sub-feature needing it (e.g. `src/features/cam/(helpers)/`, not nested inside one sub-feature), so a single search/rename touches every consumer instead of N near-duplicate copies that drift out of sync. See `src/features/cam/(helpers)/cam-constants.ts` for the reference pattern.

### Types

- **No `(types)/` folder** — define types inline where used:
  - Response/data types → top of the hook file that returns them
  - Component prop types → inside the component file as `type Props = { ... }`

---

## File Rules

- **Max 200 lines per file** — split into smaller units if exceeded
- **Kebab-case filenames**: `user-card.tsx`, `use-user-data.ts` (never PascalCase filenames)
- **`'use client'`** required at top of any file using hooks, browser APIs, or event handlers
- Server Components are the default — only add `'use client'` when necessary
- **1 component per file** — each exported component in its own `.tsx` file
- **Mock data in hooks** — fake/stub data lives in the hook, not in components

---

## Component Rules

- **Logic in hooks, not components** — components only render JSX
- **No business logic** in component files
- **No magic numbers** — extract to named constants
- **Currency always from `useCurrency()`** — never hardcode `€`, `$`, or any currency symbol/code in JSX; import `useCurrency` from `@/shared/stores/use-user-store` and use `currency.symbol`. Default is EUR (`€`).
- **Every `DialogContent` and `SheetContent` must have a title** — always include `<DialogTitle>` or `<SheetTitle>` as a direct child; use `className="sr-only"` to visually hide it when the title is decorative. Radix UI will warn in the console and screen readers will fail without it.
- **AlertDialog pattern** — use `AlertDialogContent` without a `size` prop; nest `AlertDialogHeader` (contains `AlertDialogTitle` + `AlertDialogDescription`) then `AlertDialogFooter` (contains `AlertDialogCancel` then `AlertDialogAction`). `AlertDialogCancel` needs no `onClick` — the `onOpenChange` handler closes it. Use `variant="destructive"` on `AlertDialogAction` for irreversible actions (delete, revoke, etc.).
- **`translate="no"` on all user-input elements** — every `<input>`, `<textarea>`, `<select>` and their float/group wrappers must carry `translate="no"` so browser auto-translate never corrupts user-entered values or option labels
- **Empty states use `<Empty>`** — any list, grid or section with no data must render the `Empty` component family from `@/shared/components/ui/empty` — never a plain `<p>` or custom div
- **Empty state icon style** — for prominent empty states (product lists, catalogs, drawers, table/list sections): use `<EmptyMedia>` **without** `variant` and apply `className="size-12 text-primary opacity-40"` on the icon. Never use `variant="icon"` for these — it forces a tiny 32 px rounded chip that reads as an afterthought. Never oversize the icon either (e.g. `size-24`) — combined with `Empty`'s gap it spreads icon/title/description too far apart and the state reads as emptier than it is. Reserve `variant="icon"` only for small inline empty states (e.g. a note inside a compact card/table cell).

  ```tsx
  // ✅ Prominent (product list, cart, drawer section, table)
  <Empty>
    <EmptyMedia>
      <ShoppingCartIcon className="size-12 text-primary opacity-40" />
    </EmptyMedia>
    <EmptyHeader>
      <EmptyTitle>{t('noProducts')}</EmptyTitle>
      <EmptyDescription>{t('noProductsDescription')}</EmptyDescription>
    </EmptyHeader>
  </Empty>

  // ✅ Small / inline section
  <EmptyMedia variant="icon"><FolderIcon /></EmptyMedia>
  ```
- **Skeleton pattern**: every data-fetching component has a `*-skeleton.tsx` sibling
- **Always use `<Skeleton>` from `@/shared/components/ui/skeleton`** to build loading placeholders — never a bare `<div>` with hand-rolled `animate-pulse`/`bg-muted` classes
- **Image/video overview on click → `MediaLightbox`** — any "click a thumbnail to view it full-screen" flow (attachments, uploaded previews, media grids) must use `MediaLightbox` from `@/shared/components/ui/media-lightbox`, never a custom-built modal/lightbox. Map your data into `{ src, alt? }[]` and pass `items`/`index`/`open`/`onOpenChange`; video files (mp4/webm/mov/avi) are detected and rendered automatically.
- **Row/card "⋮" action menu → `OptionMenu`** — any three-dot/kebab action menu (table row actions, card actions, list item actions) must use `OptionMenu` from `@/shared/components/ui/option-menu`, never a hand-rolled `DropdownMenu` + `Button` + icon. Pass `items: OptionMenuItem[]` (`key`, `label`, optional `icon`/`href`/`onClick`/`disabled`/`destructive`/`hidden`) — it returns `null` automatically when every item is `hidden`, and both the trigger and each item already call `stopPropagation()` so it's safe to drop into a clickable row/card without extra wrapper `onClick={(e) => e.stopPropagation()}` divs.
  - **Never wrap a row/card containing an `OptionMenu` (or any Radix-portaled dropdown) in `<Link>`.** A click inside the portaled dropdown content still bubbles through the *React* tree (not the DOM tree) up to the Link and can trigger navigation even with `stopPropagation()` on the menu. Instead, make the row/card `relative`, put an absolutely-positioned full-cover `<Link className="absolute inset-0" />` (or a `<button>` calling `router.push`) as the **last** child so it sits on top for hit-testing, then wrap `OptionMenu` (and anything else that must stay interactive) in a `relative z-10` container so it wins over the overlay in its own bounding box. See `activation-item-card.tsx` for the reference implementation.
- **Error boundary**: every page route must have a sibling `error.tsx` using `ErrorPage` from `@/shared/components/common/error-page`
- **New shared component → showcase** — whenever adding a component to `src/shared/components/`, create a matching section in `src/app/[locale]/(public)/components/_sections/` and register it in `src/app/[locale]/(public)/components/page.tsx`
- **Mobile-first responsive**: use `sm:`, `md:`, `lg:` breakpoints
- **Dark mode**: handled automatically via CSS semantic tokens — never write `.dark:` overrides

### Custom Icons

Each custom SVG icon lives in its own file inside **`src/shared/components/common/icons/`**, re-exported from `index.tsx`:

```
src/shared/components/common/icons/
├── index.tsx          ← re-exports every icon
├── icon-cube.tsx      ← one icon per file (kebab-case filename)
└── ...
```

```tsx
// ✅ Correct
import { IconCube } from '@/shared/components/common/icons';
<IconCube className="size-6" />

// ❌ Never inline raw SVG in a component file
<svg>...</svg>

// ❌ Never put multiple icons in one file
```

Icon rules:
- **One icon per file** — kebab-case filename matching the export (`icon-cube.tsx` → `IconCube`)
- **`fill="currentColor"`** on `<svg>` — color inherited from parent's `text-*` class
- **Only `className?: string` prop** — no `color` prop; parent controls color with Tailwind
- **No `width`/`height` on `<svg>`** — size set via `className` (e.g. `size-5`)
- **Update `index.tsx`** with a named re-export for every new icon
- Naming: `Icon<PascalName>` (e.g. `IconDashboards`, `IconCart`)

---

## Styling Rules

- **Tailwind CSS v4** — use canonical class names (`h-18` not `h-[72px]`)
- **Semantic color tokens only** — never hardcode `#hex`, `rgb()`, or raw color values in JSX
- **oklch() color space** in `globals.css` — register new colors in `@theme inline` and `:root`/`.dark`
- **Design pixel tolerance** — match design intent using the nearest Tailwind class
- **`_custom-scroll` / `_custom-scroll-x` on every scrollable element** — any element with `overflow-y-auto`/`overflow-y-scroll` must also carry `_custom-scroll`, and any with `overflow-x-auto`/`overflow-x-scroll` must carry `_custom-scroll-x` (defined in `globals.css`). This restyles the native scrollbar (thin, transparent track, subtle thumb) so it's consistent everywhere instead of each browser's default bar. Never leave a scrollable container unstyled, and never hand-roll a one-off scrollbar style.
  - **Flex-column scroll containers**: when scrollable cards/rows are direct children of a `flex flex-col` container, give each child `shrink-0` — otherwise flexbox shrinks them to fit instead of overflowing, so the scrollbar never appears and content just looks squished. See `kanban-board.tsx` (column) + `activation-item-card.tsx` (card) for the reference pattern: column gets `min-h-0 overflow-y-auto _custom-scroll`, each card gets `shrink-0`.

Available semantic tokens (key ones):

```
bg-background / text-foreground
bg-card / text-card-foreground
bg-muted / text-muted-foreground
bg-primary / text-primary-foreground
bg-destructive
border-border / border-input
bg-sidebar / text-sidebar-foreground
```

---

## Date & Time

### DB Convention (Germany UTC+0 quirk)

All timestamps in the DB are stored as **UTC+0**, but the stored value **is** Germany local time — the server applies no offset. Example: "14:00 Germany time" is stored and returned as `14:00Z`, not `13:00Z`.

The app targets Germany (UTC+1/+2). Per-user timezone is a planned future feature — the architecture is designed so that adding it requires only a one-line change in `@/lib/date-utils`.

### Rules

1. **Never `import dayjs from 'dayjs'`** in any component — always `import { dayjs } from '@/lib/date-utils'`
2. **Never `new Date()`** for "now" — always `nowUtc()` from `@/lib/date-utils`
3. **Always `dayjs.utc(x)`** for any date from DB or state — never bare `dayjs(x)`
4. **Never hardcode format strings** — always get the format from `useDateFormat()` and pass it to `formatDate()`
5. **Date pickers send values as-is** — user picks `14:00` → API receives `14:00Z`. Use `toApiDate(date)` from `@/lib/date-utils` to serialize.

### Utilities (`@/lib/date-utils`)

```ts
import { formatDate, nowUtc, toApiDate } from '@/lib/date-utils'
import { useDateFormat } from '@/shared/stores/use-user-store'

// Display a DB date — always use formatDate with the user's format:
const dateFormat = useDateFormat()
formatDate(dbDate, dateFormat)           // ✅ date only  →  e.g. "04/06/2026"
formatDate(dbDate, dateFormat, true)     // ✅ with time  →  e.g. "04/06/2026 14:00"
dayjs.utc(dbDate).format('DD/MM/YYYY')  // ❌ hardcoded format — never do this

// Current time:
nowUtc()       // ✅ returns UTC Date
new Date()     // ❌ local timezone leaks in

// Serialize for API:
toApiDate(pickedDate)            // ✅ sends exactly as picked
pickedDate.toISOString()         // ❌ browser may shift the time
```

### Date Format Store

User's preferred date format lives in `useUserStore`. Use the convenience selector in components and hooks:

```ts
import { useDateFormat } from '@/shared/stores/use-user-store'

const dateFormat = useDateFormat()  // 'DD/MM/YYYY' | 'DD-MM-YYYY' | 'MM/DD/YYYY' | 'MM-DD-YYYY'
```

To update it (e.g. from user settings form):
```ts
const setDateFormat = useUserStore((s) => s.setDateFormat)
setDateFormat('MM/DD/YYYY')
```

### Future Timezone Support

When `user.timezone` is available from settings, change display to:
```ts
dayjs.utc(dbDate).tz(user.timezone).format(dateFormat)
```
Pass `user.timezone` to `toApiDate(date, user.timezone)` for sending. Both utilities already accept the optional `userTimezone` parameter — no component changes needed.

---

## Data Fetching

- **CSR only** — all data fetching via `useQuery` (never `fetch` in Server Components for authenticated data)
- **No code-generation layer** — feature hooks call the API directly with `apiProxy`
- **Fetcher lives with the hook** — define the fetcher function inline at the top of the hook file; only extract a `(services)/<name>-service.ts` when the same fetcher is reused by multiple hooks
- **No try/catch in hooks or services** — the api client's response interceptor handles error toasts globally (see Error Handling)
- **Return `data` directly** from axios responses
- Cache invalidation in `onSuccess` of `useMutation`

```ts
// ✅ Fetcher + hook in the same file — the default pattern
async function getUsers(params: UserFilters) {
  const { data } = await apiProxy.get<PaginatedResponse<User>>('/users', { params });
  return data;
}

export function useUsersData(filters: UserFilters) {
  return useQuery({ queryKey: ['users', filters], queryFn: () => getUsers(filters) });
}
```

---

## Defensive Data Rendering (Null/Array Safety)

The backend is not a reliable source of well-shaped data — nested relations can be `null`, and list fields can come back as `{}` instead of `[]` when empty. **The app must never crash from this.** A crash from unguarded data access takes down the whole page, not just one field.

- **Never chain into a nested API object without a null check.** Any relation-style field (`location`, `user`, `address`, `assignedTo`, etc.) can be `null`/`undefined` even when the TS type says otherwise — the type describes the contract, not what the BE actually sends. Use optional chaining (`?.`) at every level, and either hide the dependent UI or fall back to a safe default:

  ```tsx
  // ❌ Crashes the whole page if location is null
  <span>{event.location.city}</span>

  // ✅ Hide the row when the field is absent
  {event.location?.city && (
    <span>{event.location.city}</span>
  )}

  // ✅ Or fall back to a placeholder when something must render
  <span>{event.location?.city ?? '-'}</span>
  ```

- **Never call `.map()`/`.filter()`/`.forEach()` directly on an API array field.** When a list is empty, some BE endpoints return `{}` or `null` instead of `[]`, which crashes immediately on `.map`. Normalize with `Array.isArray(...)` before iterating:

  ```ts
  // ❌ Crashes if BE returns {} instead of []
  event.attachments.map((a) => a.url)

  // ✅ Normalize first
  const attachments = Array.isArray(event.attachments) ? event.attachments : [];
  attachments.map((a) => a.url)
  ```

- Apply this at the point of **display/iteration** (components, and mapper helpers that feed a form/UI) — it's the last line of defense so a malformed payload degrades gracefully (missing field, empty state) instead of throwing.
- Applies to every `useQuery`/`useMutation` result rendered in JSX, and to any mapper function (e.g. `(helpers)/*-mapper.ts`) that reads nested fields off an API response before handing it to a form or component.

---

## URL State

- **`useQueryStates` / `useQueryState` (nuqs)** for ALL URL param updates — no exceptions
- **NEVER `shallow: false`** — nuqs default (`shallow: true`) is correct; TanStack Query still refetches via `queryKey` change
- **NEVER `useState`** for search, filter, pagination, or sort

```ts
// Multiple params — filters, pagination:
const [filters, setFilters] = useQueryStates({
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(''),
});
// URL updates → nuqs state updates → queryKey changes → TanStack Query refetches

// Single param:
const [search, setSearch] = useQueryState('search', parseAsString.withDefault(''));
```

---

## Forms

- **Zod schemas** in `(helpers)/<feature>-schema.ts`
- **Form logic** in `(hooks)/use-<name>-form.ts`
- **`useFormContext()`** for child field components (multi-step or complex forms)
- **Translate validation messages** — zod `.message()` must use i18n keys resolved at runtime
- **`FormProvider`** wraps complex multi-step forms

---

## i18n

Locale is in the **URL prefix**: `/de/dashboards`, `/en/settings`. Default locale: `de`.

### Routing

All pages live under `src/app/[locale]/`. Middleware (`src/proxy.ts`) handles:
- Redirecting `/` to `/{locale}/dashboards` or `/{locale}/login`
- Auth guards for protected routes
- next-intl locale detection/normalisation via `createMiddleware`

### How `useTranslations()` works

Same import for Server and Client Components — no hydration mismatch:

```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('dashboard');
return <h1>{t('title')}</h1>;
```

### Navigation

Always use `@/i18n/navigation` — **never** `next/navigation` directly:

```tsx
import { Link, useRouter, usePathname } from '@/i18n/navigation';

<Link href="/dashboards">Dashboard</Link>  // renders /de/dashboards automatically
router.push('/settings');                 // navigates to /de/settings
const pathname = usePathname();           // /dashboards (no locale prefix)
```

### Locale Lifecycle (user settings)

`useMe()` (`src/features/auth/(hooks)/use-me.ts`) fetches `/user/me` directly via `apiProxy` and applies the user's preferred language/appearance on load:

```tsx
async function fetchMe(): Promise<MeData> {
  const response = await apiProxy.get('/user/me');
  return response.data.data as MeData;
}

const query = useQuery({ queryKey: ['me'], queryFn: fetchMe });
```

- **All static text** via `useTranslations('namespace')` — never hardcode strings in JSX
- **Never translate dynamic API data** (names, descriptions from backend)
- **Backend error codes** live under the **`errors`** namespace — resolved via `getErrorMessage(error_code)`, not `useTranslations()` (see Error Handling)
- **Both `en.json` and `de.json`** must be updated together whenever adding keys
- Namespace per feature in camelCase matching the folder name
- **Default locale is `de`** — German is the fallback
- `usePathname()` returns path **without** locale — `/dashboards` not `/de/dashboards`
- `useRouter().push('/path')` **auto-adds locale** — never manually prefix `/de/`

---

## API Client

`src/lib/api-client.ts` exports a single axios instance:

| Instance | Base URL | When to use |
|----------|----------|-------------|
| `apiProxy` (named export, only export) | `/api` | All API calls — auth (login, refresh-token, clear-cookies) and every other regular API call |

**All calls route through the Next.js server, never straight to the backend.** Requests either hit a dedicated Next.js route handler (`src/app/api/auth/...`) or fall through to the catch-all proxy `src/app/api/[...path]/route.ts`, which forwards the request server-side to the real backend (core API) based on the path's module prefix —  This lets the backend live on an internal-only network reachable from the Next server but not from the browser. Add a new backend module the same way the catch-all already does — no new client needed, just an entry in `MODULE_PREFIXES` in `src/app/api/[...path]/route.ts`.



Shared interceptor behavior:
- **Request**: attaches `x-lang` (from URL path locale), `x-user-identifier` (fingerprint), `Authorization: Bearer <AT>`; proactively refreshes AT if missing
- **Response**: unwraps server envelope (`{ status, message, error_code, data }`), handles 401 GET retry with refresh, error toasts via `getErrorMessage(error_code)` (see Error Handling)
- **Cross-tab logout** via `BroadcastChannel('auth')` + `clientLogout()` export

For login/logout, use `apiProxy` (needed to set/read httpOnly cookies):
```ts
import { apiProxy } from '@/lib/api-client';

export async function login(dto: LoginDto) {
  const { data } = await apiProxy.post<LoginResponse>('/auth/login', dto);
  return data;
}
```

---

## Error Handling

The backend returns a consistent envelope: `{ status, message, error_code, data }`. `error_code` is a stable machine key (e.g. `WRONG_PASSWORD`, `INVITATION_EXPIRED`).

- **`getErrorMessage(error_code)`** (`@/lib/get-error-message`) resolves the code to a translated string by reading the **`errors`** namespace of `src/messages/en.json` / `de.json` (dots in the code become underscores; falls back to `errors.default`)
- The `apiProxy` response interceptor calls `getErrorMessage()` and shows it via `toast.error()` automatically on any 4xx/5xx response — **feature code never needs to catch or toast API errors itself**
- **Whenever the backend introduces a new `error_code`, add a matching key under `errors` in both `en.json` and `de.json`** — same rule as any other i18n key

```json
// src/messages/en.json
{
  "errors": {
    "default": "An unexpected error has occurred. Please try again later.",
    "WRONG_PASSWORD": "Incorrect password.",
    "INVITATION_EXPIRED": "This invitation has expired. Please delete it and send a new one."
  }
}
```

---

## Tab Navigation

Use `TabsUrl` from `@/shared/components/ui/tabs-url` for all page-level tabs:

```tsx
<TabsUrl defaultValue="overview">           {/* defaultValue = first tab */}
  <TabsList variant="line">
    <TabsTrigger value="overview">{t('tabOverview')}</TabsTrigger>
    <TabsTrigger value="history">{t('tabHistory')}</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
</TabsUrl>

{/* For drawers/dialogs — local state only: */}
<TabsUrl defaultValue="info" syncUrl={false}>...</TabsUrl>
```

---

## What NOT to Do

- ❌ Dev creating, editing, or deleting a `*.test.ts(x)` or `*.spec.ts` file — flag it back to QA instead
- ❌ QA editing a file under `src/` to make a test pass — that's a bug report back to dev
- ❌ Fixing a bug without a QA reproduction test, without saying that coverage is pending
- ❌ Changing the implementation and then "fixing up" the tests to match — always QA's call, never dev's
- ❌ `test.skip`, `it.skip`, or deleting a failing test to get a green run
- ❌ Claiming "all tests pass" without showing the command output
- ❌ Guessing `npm test` / `yarn test` — this repo uses `pnpm test` / `pnpm test:e2e`
- ❌ Asserting on Tailwind class names in tests — assert roles, text, or `data-*`
- ❌ `waitForTimeout` in a Playwright spec — use `expect(...).toBeVisible()`, it auto-waits
- ❌ Declaring a UI change done without opening a browser (Playwright MCP)
- ❌ Leaving an MCP browser session that proved something without promoting it to `e2e/*.spec.ts`
- ❌ Editing `CLAUDE.md` without mirroring into `.github/copilot-instructions.md`
- ❌ Adding an MCP server to `.mcp.json` only — `.vscode/mcp.json` must match
- ❌ Copying a skill's body into a rule file instead of linking to its path
- ❌ Accessing nested API-object fields (`event.location.city`) without a null check — always `event.location?.city`
- ❌ Calling `.map()`/`.filter()`/`.forEach()` directly on an API array field without an `Array.isArray()` guard — BE may return `{}`/`null` for an empty list
- ❌ Building a custom modal/lightbox for click-to-view image or video previews — use `MediaLightbox` from `@/shared/components/ui/media-lightbox`
- ❌ Hand-rolling a `DropdownMenu` + icon `Button` for a row/card "⋮" action menu — use `OptionMenu` from `@/shared/components/ui/option-menu`
- ❌ Wrapping a row/card that contains an `OptionMenu`/dropdown in `<Link>` — Radix's portal still bubbles clicks through the React tree into the Link and navigates; use the stretched-overlay-link pattern instead
- ❌ `useMemo`, `useCallback`, `React.memo`
- ❌ `forwardRef`
- ❌ Custom React Context (`createContext`/`useContext`) for cross-component app state — use zustand instead; `FormProvider` from react-hook-form is the only exception
- ❌ Inline SVG in component files (use `src/shared/components/common/icons/`)
- ❌ Hand-rolled skeleton `<div>`s with custom `animate-pulse`/CSS — always use `<Skeleton>` from `@/shared/components/ui/skeleton`
- ❌ Hardcoded colors (`#hex`, `rgb()`) in JSX/TSX
- ❌ `import { useRouter } from 'next/navigation'` — use `@/i18n/navigation`
- ❌ `useState` for search/filter/pagination (use nuqs `useQueryStates`)
- ❌ `shallow: false` in `useQueryStates` — nuqs default is always correct
- ❌ `window.history.pushState` manually — always use nuqs
- ❌ Page route without a sibling `loading.tsx`
- ❌ Page route without a sibling `error.tsx` (wrap with `ErrorPage` from `@/shared/components/common/error-page`)
- ❌ try/catch in service files
- ❌ Toast calls in service files
- ❌ Using any toast library other than **sonner** — always import `toast` from `'sonner'`
- ❌ Files longer than 200 lines
- ❌ Multiple exported components in one file
- ❌ Mock/fake data defined in component files (put in hooks)
- ❌ Separate `(types)/` folder — types go inline in hooks or components
- ❌ Hardcoded strings in JSX (use `useTranslations`)
- ❌ Adding only `en.json` without updating `de.json`
- ❌ Manually prefixing `/de/` in `router.push` calls — locale is added automatically
- ❌ Hardcoding error copy in components — always resolve via `getErrorMessage(error_code)` / the `errors` i18n namespace
- ❌ Catching/toasting API errors manually in hooks or services — the api client interceptor already does this
- ❌ Using `useState` to track active tab in page-level tabs (use `TabsUrl`)
- ❌ `variant="icon"` on `<EmptyMedia>` for product lists, catalogs, drawers, or table/list sections — use no variant and `className="size-12 text-primary opacity-40"` on the icon instead
- ❌ Oversizing the empty-state icon (e.g. `size-24`) or adding extra `gap-*`/`mb-*` overrides around `Empty`/`EmptyHeader` — keep the default compact rhythm so the state doesn't read as more empty than it is
- ❌ Adding a new component to `src/shared/components/` without a matching `_sections/` entry and `page.tsx` import in the components showcase
