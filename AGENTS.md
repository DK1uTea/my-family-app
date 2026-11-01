# AGENTS.md

Entry point for every AI agent working in this repo — Claude Code, GitHub Copilot, Cursor,
Codex, Gemini CLI, and anything else. This file is deliberately short. It tells you the
workflow, the commands, the hard constraints, and where the full rules live.

## Where the Rules Live

| File | Read by | Role |
| ---- | ------- | ---- |
| `CLAUDE.md` | Claude Code | **Canonical** — the complete rule set. Read this. |
| `.github/copilot-instructions.md` | GitHub Copilot | Full mirror of `CLAUDE.md` |
| `AGENTS.md` (this file) | Cursor, Codex, Gemini CLI, Copilot agent mode | Pointer + workflow |
| `.claude/skills/<name>/SKILL.md` | Any agent | Deep-dive procedures, referenced by path |

**If you only read one other file, read `CLAUDE.md`.** It has the import rules, the
architecture, the styling and i18n conventions, the defensive-data-rendering rules, and the
"what NOT to do" list. Everything here assumes you have.

## Rule 1 — QA Owns Every Test Case, Dev Owns Implementation Only

Test authorship is a role, not a step in the dev loop. **QA writes and maintains every
test case — unit/component (Vitest) and E2E (Playwright) alike.** Dev implements against
the approved module spec and **never creates, edits, or deletes a `*.test.ts(x)` or
`*.spec.ts` file.** QA never edits implementation source under `src/`; backend module
`src/server/modules/<domain>/SPEC.md` files are documentation and may be updated by QA. The two work in parallel off the
same approved spec — dev does not wait for QA's test files to exist first.

Which role applies depends on what the task asks for, not on who is typing — asked to
implement/fix/refactor → dev; asked to write/update test cases or coverage → QA. If a
request is ambiguous about which lane applies, ask.

Bug fixes: QA reproduces the bug in a failing test first; dev fixes it against the report.
Requirement changes: QA updates the test that encodes the old behaviour; dev updates the
implementation. If dev finds a test that looks wrong or stale, it gets flagged back to QA —
never edited directly. **Never skip test-case authorship unless the human explicitly
instructs you to.**

Full rules, including the complete role-split table: `.claude/skills/test-driven-development/SKILL.md`

## Rule 2 — Every Rule Change Fans Out to Every Agent

The team does not all use the same agent. A rule that only lands in `CLAUDE.md` is a rule
Copilot and Cursor users will violate.

**When you add, change or delete a rule, convention, skill, npm script or MCP server, update
every affected file in the same change** — `CLAUDE.md`, `.github/copilot-instructions.md`,
this file, and `.mcp.json` + `.vscode/mcp.json` for MCP servers. Then grep the new wording
across all of them and list every file you touched.

Full protocol and routing table: `.claude/skills/agent-rules-sync/SKILL.md`

## Rule 3 — Every Interactive Element Must Be Accessible

Keyboard-operable and screen-reader-usable, at generation time — not as a later polish
pass. Full rules: `.claude/skills/accessibility/SKILL.md`.

- **A placeholder is not a label** — real `<label htmlFor>` + matching `id` on every
  input, textarea and select.
- **Icon-only buttons need `aria-label`**, changing with state (`aria-pressed`).
- **Never `tabIndex={-1}`** on something the user must operate; **never `outline-none`**
  without a `focus-visible:` replacement.
- **Errors get `aria-describedby` → a `role="alert"` node**, plus `aria-invalid`.
- **Contrast is NOT enforced** — the per-tenant theme owns the palette; never fix, test or report it
  (`/60`) and never a raw palette colour to make text look secondary.
- New `aria-label` strings go into `en.json` **and** `vi.json`.

Enforcement is a ratchet: `eslint-plugin-jsx-a11y` recommended runs at `warn` over ~78
pre-existing violations, rules already at zero run at `error`, and `src/features/auth/**`
is fully `error`. **Never add a new violation of a warn-level rule.** Runtime checks use
`@axe-core/playwright` via `scanA11y` (`e2e/shared/a11y.ts`); apart from its standing `color-contrast` theme exemption, never `.disableRules()` to go green.

## Rule 4 — Business Context Is Part of the Contract

Every top-level `src/features/<feature>/` must contain `CONTEXT.md`. Before changing
business behaviour or an API contract, read that file and update it in the same change
when routes, permissions, validation, workflow/status, endpoint method/payload, side
effects, cache invalidation, navigation, or known limitations change.

Never guess ambiguous business meaning. Inspect implementation and tests; if it is still
uncertain, ask the human and record the confirmed answer in `CONTEXT.md`. A new feature is
incomplete without this file.

## The Workflow

```
SPEC ──→ DEV (implement) ─┐
      └→ QA (test cases) ─┴──→ VERIFY ──→ SYNC
```

Dev and QA run in parallel off the same approved spec, not sequentially.

| Stage | Skill | Gate before advancing |
| ----- | ----- | --------------------- |
| **SPEC** | `spec-driven-development` | Human-approved spec: UI `docs/specs/<feature>.md`; backend `src/server/modules/<domain>/SPEC.md` |
| **DEV** (parallel with QA) | `test-driven-development` | `pnpm test`, `pnpm typecheck`, `pnpm lint` pass against existing QA test cases |
| **QA** (parallel with DEV) | `test-driven-development`, `e2e-module-testing` | Every behaviour bullet has a test case that failed for the right reason first |
| **VERIFY** | `browser-verification-playwright` | Console clean, both locales, `pnpm test:e2e` passes |
| **SYNC** | `agent-rules-sync` | Every mirrored file updated and listed |

Where to start: new feature or module → SPEC, then dev and QA proceed in parallel. Bug
report → QA reproduces it first, dev fixes it against the report. Requirement change → QA
updates the test, dev updates the implementation. Visual-only restyle → VERIFY. Typo or
config → just do it.

Map and definition of done: `.claude/skills/feature-workflow/SKILL.md`

## Skills

| Skill | When to read it |
| ----- | --------------- |
| `feature-workflow` | **Start here** for any non-trivial work |
| `spec-driven-development` | New feature/module, vague requirements, multi-file change |
| `test-driven-development` | Any behaviour change — the QA/dev test-ownership split and role table |
| `e2e-module-testing` | Any Playwright spec — folder-per-module layout, module spec → test cases (QA-owned) |
| `browser-verification-playwright` | UI change, visual bug, console/network inspection |
| `accessibility` | Any interactive JSX — labels, names, keyboard, focus, contrast |
| `agent-rules-sync` | Any rule, skill, script or MCP change |
| `nextjs-new-module` | New top-level sidebar entry — read in full, follow in order |
| `neon` | Neon project setup, CLI/MCP, and Neon services |
| `neon-postgres` | Neon Postgres connections, SQL, schema, migrations, and diagnostics |

Pattern skills for components, data fetching, forms, URL state, i18n, tabs, colors and
buttons live in `.omc/skills/`, mirrored as slash commands in `.claude/commands/`.

## Commands

```bash
pnpm dev                  # dev server on :3000
pnpm build                # production build
pnpm lint                 # eslint
pnpm typecheck            # tsc --noEmit

pnpm test                 # unit + component (Vitest)
pnpm test:watch           # watch loop
pnpm test:coverage        # coverage report

pnpm test:e2e             # every module (Playwright — boots the dev server itself)
pnpm test:e2e login       # ONE module — the e2e/modules/<name>/ folder name is the filter
pnpm test:e2e login/validation   # one aspect of one module
pnpm test:e2e:ui login    # Playwright UI, filtered to that module
pnpm test:e2e:headed login       # watch a real browser run it
pnpm test:e2e:debug login        # step through with the inspector
pnpm test:e2e:a11y        # every module's a11y.spec.ts
pnpm test:e2e:report      # open the last HTML report
pnpm e2e:new <module>     # scaffold a module folder (--public for no-auth pages)

pnpm test:all             # everything
pnpm db:generate          # generate a Drizzle migration from schema changes
pnpm db:migrate           # apply pending migrations to the configured database
pnpm db:check             # check Drizzle migration history
pnpm db:seed              # create the local super admin from .env.local credentials
pnpm openapi:generate     # generate OpenAPI JSON from route contracts
pnpm openapi:check        # verify route coverage and generated OpenAPI JSON
```

This is a **pnpm** repo. Never guess `npm test` or `yarn test`.

## Where Tests Go

| Kind | Location | Extension | Runner |
| ---- | -------- | --------- | ------ |
| Unit / component | `tests/`, mirroring the `src/` tree | `*.test.ts` / `*.test.tsx` | Vitest + jsdom + RTL |
| E2E | `e2e/modules/<module>/` | `*.spec.ts` | Playwright |

The extensions are distinct on purpose — neither runner picks up the other's files.

**`src/` holds source only.** No test file sits next to the code it covers — a unit or component test mirrors the source path under `tests/`, so `src/features/x/y.ts` is tested by `tests/features/x/y.test.ts`. Browsing a feature folder shows the feature and nothing else. Tests import through the `@/` alias, never a relative path back into `src`.

**QA owns every file in both rows of this table.** Dev runs `pnpm test` / `pnpm test:e2e`
against them but never creates, edits, or deletes one — see Rule 1 above.

**E2E is local-only — no CI job, by decision.** Run `pnpm test:e2e` yourself before pushing.
The captcha bypass is gated on `NODE_ENV !== 'production'` so it only works against
`pnpm dev`, and specs mutate real Events through one shared real account. `workers` is capped
at 2 locally (Playwright's default of half your CPU cores starves data-dependent UI) and
`retries` is 0. Never switch the server to `pnpm build && pnpm start`.

**E2E is one folder per module**, and the folder name must match the route segment because
that name is the filter: `pnpm test:e2e login` is `playwright test login`, a path substring
match.

```
e2e/shared/                  harness only — no specs (session.ts, console.ts, a11y.ts)
e2e/modules/<module>/        <module>.page.ts  <module>.data.ts  <flow-name>.spec.ts
                             (one mandatory spec per business flow, named after the flow —
                             e.g. create-event.spec.ts, edit-event.spec.ts, never flow.spec.ts;
                             other aspects are optional, added only when a branch needs a
                             real-browser guard)
```

**Every business flow the module owns gets its own mandatory spec file, named after the
flow.** A module with one flow (e.g. `login`) gets one file; a module with genuinely
separate journeys (e.g. `events` — create vs. edit) gets one file per journey. Small team,
optimizing for locking down working business behaviour with minimum maintenance — not
exhaustive UI coverage. Field-level validation and mapper guards belong in Vitest unit tests
instead. For UI modules, describe behavior in `docs/specs/<module>.md` (template
`docs/specs/_TEMPLATE.module.md`) and group happy-path behavior bullets by flow. Backend
behavior belongs in `src/server/modules/<domain>/SPEC.md`. Scaffold UI E2E folders with
`pnpm e2e:new <module>`. Each flow spec creates
whatever data it needs itself — never depend on another spec file's leftover state — and
every flow spec authenticates via `resumeSessionAt`, except `login`'s own flow spec, which is
the one place the real UI form is exercised on purpose.

**One flow spec file = one `test()`, named after the flow** — `test('create event', ...)`,
not a `describe` split into a sign-in test, an unauthenticated-visitor test, and a "does the
thing" test. Authenticating via `resumeSessionAt` is the first line of that one test. Keep
the test name short and generic (`'create event'`, not a sentence describing every step).

Full rules: `.claude/skills/e2e-module-testing/SKILL.md`.

**Locators use `page.getByTestId('<name>')` against a `data-testid` attribute, not
role/text.** Role/text locators broke in practice when rendered copy or structure (language,
an added iframe) drifted independently of the underlying feature — `data-testid` survives
that. Adding a missing `data-testid` is a `src/` change for dev, not a QA edit, unless a
manager explicitly authorizes crossing that line for a specific task.

**Every spec hits the real backend — no `page.route()` mocking**, except simulating a
network failure no real account can produce (never to fake a *successful* response). This
relies on `SKIP_CAPTCHA_VERIFICATION=true` in `.env.local` (double-gated behind
`NODE_ENV !== 'production'` in `src/lib/verify-captcha.ts`), which skips the backend's
reCAPTCHA score check so a headless browser's low bot score never gets a real, correct
login rejected. A branch a fresh sign-in cannot reach (locked account, inactive account,
restricted permissions) needs a dedicated real account via `.env.local`, read through
`lockedCredentials()` / `inactiveCredentials()` / `restrictedCredentials()` in
`e2e/shared/session.ts` — each returns `null` and the test skips itself when unconfigured.
Accepted risk: a wrong-password test spends a real attempt and can lock the account after
five in a row.

**Never write a UI scenario from what you assume the page does.** Open it with the
Playwright MCP browser, read the real DOM/network state, then assert what you saw —
including server-driven values like an attempts-remaining count, read from the actual
response rather than hardcoded. Locators go in a page object under `e2e/modules/<module>/`.
Recipe: `.claude/skills/browser-verification-playwright/SKILL.md`.

**Testing a module behind auth**: a module spec starts the way a user does —
`signIn(page)` fills the real login form and waits for the redirect, then
`openModule(page, 'userSettings')` clicks the sidebar entry. Use `resumeSessionAt` for
specs where the journey is not the thing under test. Harness: `e2e/shared/session.ts`.
Reference: `e2e/modules/user-settings/`.

Three traps that bite every newcomer:

1. `src/app/api/auth/*` always answers **HTTP 200** with the real status inside the envelope.
2. The **locale comes from cookies, not the URL**; without a locale cookie, the app defaults to `/vi/`.
3. A real account with no `role.navbar` entries **hides every non-`alwaysShow` module** —
   the stores read `null` as "allow everything" but `[]` as "allow nothing". That's the app
   working correctly, not a bug; use `restrictedCredentials()` to test gating deliberately.

## MCP Servers

| Server | Declared in | Purpose |
| ------ | ----------- | ------- |
| `playwright` | `.mcp.json` + `.vscode/mcp.json` | Drive a real browser to reproduce, inspect and verify UI changes |
| `Neon` | `.mcp.json` + `.vscode/mcp.json` | Manage the linked Neon project and Postgres service through OAuth |

Runs `npx -y @playwright/mcp@latest --isolated --browser chrome`. Start `pnpm dev` yourself
before an MCP session. Every path needs its locale prefix: `/vi/login`, `/en/dashboards`.

## Hard Constraints

First-party API request flow is Route Handler -> `src/server/modules/<domain>` service ->
`src/server/layer-data/<domain>` repository contract/Drizzle adapter -> shared Drizzle client
-> Neon. Route Handlers own HTTP concerns; services own use cases; neither queries Drizzle
directly. Compose with TypeScript factories, not NestJS. Drizzle schemas live in
`src/server/drizzle/schema/` and migrations in
`src/server/drizzle/migrations/`.

Use `pnpm db:generate -- --name <short_snake_case_name>` to create a migration named
`YYYYMMDDHHmmss_<name>.sql` (UTC timestamp). Review and commit it with the schema, snapshots,
and journal; keep historical filenames unchanged. Then run `pnpm db:migrate`.
`pnpm db:check` validates migration history; CI checks schema drift. `pnpm db:seed` creates a
local super admin from explicit `.env.local` credentials; target development only. For API
changes, update `src/server/openapi/contracts.ts` and run
`pnpm openapi:generate` then `pnpm openapi:check`. `pnpm db:push` is for prototyping only.
Full instructions: `src/server/README.md`. API docs are at

`/api/docs`; the OpenAPI source endpoint is `/api/openapi.json`.

The full list is in `CLAUDE.md`. These are the ones that break the build or the app:

- **Never `import { useRouter } from 'next/navigation'`** — use `@/i18n/navigation`. ESLint enforces it.
- **Never `import dayjs from 'dayjs'`** — use `import { dayjs } from '@/lib/date-utils'`. ESLint enforces it.
- **Never `new Date()`** for "now" — use `nowUtc()`. API timestamps are UTC instants; display them in the viewer's browser/device timezone with `formatDate()`.
- **No `useMemo` / `useCallback` / `memo` / `forwardRef`** — React Compiler is on.
- **`useState` is never the answer for search, filters, pagination or sort** — use nuqs `useQueryStates`.
- **Guard every API array before `.map()`** with `Array.isArray()` — the backend returns `{}` for empty lists.
- **Optional-chain every nested API object** — relations come back `null` regardless of the TS type.
- **Update `en.json` and `vi.json` together.** Supported locales are `en` and `vi`; default locale is `vi`.
- **No hardcoded strings or colors in JSX** — `useTranslations()` and semantic tokens only.
- **Max 200 lines per file. One component per file. Kebab-case filenames.**

## Reporting

State what you ran and what it said. "Tests pass" with no output is not a result. If you
skipped a stage, name it and say why — silence reads as an omission.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
