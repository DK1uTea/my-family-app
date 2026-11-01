---
name: e2e-module-testing
description: The E2E test structure for this repo — one folder per module under e2e/modules/, split by aspect, runnable with `pnpm test:e2e <module>`. Every spec hits the real backend, no mocking. Owned by QA — MUST be followed when writing, moving or adding any Playwright spec, and when a spec describes a module's business flow and needs test cases. Dev may run these specs but never authors or edits them. Triggers on "write tests for module", "test the X module", "e2e structure", "add e2e test", "test cases for", "module spec".
triggers:
  - write tests for module
  - test the module
  - e2e structure
  - add e2e test
  - new module test
  - test cases for
  - module spec
  - playwright structure
  - run module tests
---

# E2E Module Testing

**Owned by QA.** One folder per module. One aspect per file. `pnpm test:e2e <module>` runs
that module and nothing else. **Every spec hits the real backend — there is no mocked
mode.** Dev runs these specs (`pnpm test:e2e <module>`) to self-check an implementation, but
never creates, edits, or deletes anything under `e2e/modules/` — see the role split in
`.claude/skills/test-driven-development/SKILL.md`. A dev who finds an E2E spec wrong or
missing a case flags it back to QA rather than touching the file.

## Real Backend, By Design

This suite does not mock `page.route()`. Every test signs in and calls the real API in
`NEXT_PUBLIC_API_BASE_URL`, on the (dev) environment configured in `.env.local`. Two things
make that reliable instead of flaky:

1. **`SKIP_CAPTCHA_VERIFICATION=true`** (see `src/lib/verify-captcha.ts`) — double-gated
   behind `NODE_ENV !== 'production'`, so it can never take effect in a real deployment.
   The frontend still executes reCAPTCHA v3 and sends a token; only the backend's score
   check is skipped. Without this, a headless browser's low bot-likelihood score made real
   logins reject intermittently — not a rate limit, Google's own scoring.
2. **Dedicated test accounts**, supplied via `.env.local`, for backend states a fresh
   sign-in cannot produce: a locked account, an inactive account, one restricted to
   specific sidebar modules. See `.env.example` for the full list of variables. A test that
   needs one of these skips itself with a stated reason when it is not configured — it does
   not fail, and it does not fall back to a fixture.

**Accepted risk:** tests that deliberately submit a wrong password spend one of the real
five attempts the backend tracks for that account, and can lock it after five in a row.
That is the trade-off of testing against a real backend instead of a mock, and it was a
deliberate choice — not something to "fix" by mocking the response.

## The Layout

```
e2e/
├── shared/                        cross-module harness — no specs here
│   ├── session.ts                 signIn / authenticateViaApi / resumeSessionAt / MODULES
│   ├── console.ts                 watchConsole().assertClean()
│   └── a11y.ts                    scanA11y() — axe scan, contrast rule exempt
└── modules/
    ├── login/
    │   ├── login.page.ts          page object: data-testid locators + minimal visible copy
    │   ├── login.data.ts          real credentials (from env) + deliberately-wrong ones
    │   └── login.spec.ts          this module's one business flow: sign in
    └── events/
        ├── events.page.ts
        ├── events.data.ts
        ├── create-event.spec.ts   business flow: create an Event through all its steps
        └── edit-event.spec.ts     business flow: edit an existing Event through all its steps
```

**The folder name is the filter.** It must match the route segment — `login`,
`user-settings`, `customer-activation` — because `pnpm test:e2e user-settings` is just
`playwright test user-settings`, a substring match on the file path. Get the name wrong and
the module becomes unrunnable on its own.

### One spec file per business flow — named after the flow, not `flow.spec.ts`

This is a small team optimizing for locking down working business behaviour with the least
maintenance burden, not for exhaustive UI coverage. **Every module needs one mandatory spec
per distinct business flow it owns**, and the file is named after that flow in kebab-case —
`create-event.spec.ts`, `edit-event.spec.ts`, `login.spec.ts` — never the generic
`flow.spec.ts`, which says nothing about what it actually covers. A module with one flow
(e.g. `login` — there is only "sign in") gets one file; a module whose UI genuinely branches
into separate journeys (e.g. `events` — create is a fresh wizard, edit hydrates and persists
an existing record) gets one file per journey. Don't split a single linear journey into
artificial pieces just to have more files, and don't force two genuinely different journeys
into one file either — each file should read start-to-finish as the one flow it's named for.

Each flow spec is the regression guard that matters: it proves that business flow still
works end to end after a change, so a manual smoke test is not needed every time. A flow
spec that depends on another flow spec's leftover state is a bug — each file authenticates
and creates whatever data it needs itself, since Playwright runs spec files independently
and in any order (see `createDraftForEditing` in `e2e/modules/events/edit-event.spec.ts` for
the pattern: it creates its own draft before editing it, rather than reusing the Event
`create-event.spec.ts` made).

**One flow spec file = one `test()`, named after the flow — not a `describe` block split
into a sign-in test, an unauthenticated-visitor test, and a "does the actual thing" test.**
`test('create event', async ({ page }) => { ... })`, not
`test.describe('create event', () => { test('signs in...'); test('sends an
unauthenticated visitor...'); test('creates a complete draft...'); })`. Authenticating is the
first line of the one flow test, not a separate test — write
`await resumeSessionAt(page, 'events');` inline at the top and continue straight into the
flow (see "Authenticated modules" below for why this is `resumeSessionAt`, not a UI sign-in,
for every module except `login` itself). An unauthenticated-access guard is not the business
flow either; skip it unless the spec's module has no other way to verify auth is enforced.
Keep the test name itself short and generic — `'create event'`, `'edit event'`, `'sign in'`
(for `login`'s own flow) — not a
sentence describing every step (`'creates a complete draft through all five steps and
publishes the Event'`); the file name already says which flow this is, and the flow's own
code is the detail.

Aspect files beyond the business-flow specs (`content.spec.ts`, `validation.spec.ts`,
`errors.spec.ts`, `routing.spec.ts`, `a11y.spec.ts`) are **optional, not deprecated** — write
one only when a specific branch is genuinely worth a real-browser guard beyond what a
unit/component test already covers (e.g. a redirect that depends on middleware, not just a
component's own logic). Default to **not** writing them:

- Field-level validation rules, mapper defensive guards, and status/lookup logic belong in
  Vitest unit tests against the zod schema / helper directly — see
  `.claude/skills/test-driven-development/SKILL.md`'s "What to Test" table. An E2E
  `validation.spec.ts` duplicating what the schema unit test already proves adds runtime and
  maintenance cost without adding confidence.
- Accessibility, error-toast copy, and permission-gating detail are still real bugs when
  they break, but for this team's size they are not worth a dedicated always-run E2E spec
  unless a specific incident or requirement calls for pinning one down.

There is no `real.spec.ts` aspect — every spec already is real.

### Non-spec files

`*.page.ts`, `*.data.ts` are helpers, not tests — `playwright.config.ts` only picks up
`**/*.spec.ts`, so they are never collected as suites.

- **`<module>.page.ts`** — the page object. All locators live here so a markup or copy
  change touches one file. Document any locator that looks odd, with the reason.
- **`<module>.data.ts`** — credentials (read from env via the helpers in
  `e2e/shared/session.ts`) and the exact strings the user sees. Vietnamese, since `vi` is the
  default locale.

## Locators — `data-testid` first, not role/text

This repo's E2E locators use `page.getByTestId('<name>')` against a `data-testid="<name>"`
attribute on the element, not `getByRole`/`getByText`. This reverses the previous
role-and-accessible-name-first rule (still visible in old comments/history) after it broke
in practice: a page's real rendered copy and structure (language, an added iframe wrapping a
dropdown, a renamed label) can drift out from under a role/text locator with no change to
the underlying business behaviour, which is exactly what this suite exists to guard — a
business-flow spec should fail when the *feature* breaks, not when a translation string or a
wrapper element changes.

- **Add `data-testid` to source when a flow needs a stable hook that role/text can't give
  reliably** — a multi-word label that might get translated, a value inside a portal/iframe,
  one of several visually-identical rows. Name it `<feature>-<element>` in kebab-case (e.g.
  `event-mode-select`, `event-submit-button`).
- **Adding a `data-testid` is a `src/` change — it is dev's file, not QA's**, per the role
  split in `.claude/skills/test-driven-development/SKILL.md`. QA identifies which elements
  need one and hands the list to dev (or, on a small team, the same person switches hats
  explicitly to add them) — QA does not silently start editing component files to add test
  hooks.
- **A `data-testid` is additive, not a substitute for real accessible names.** Adding one to
  make a flow testable does not excuse a genuine accessibility gap (a missing `<label>`, an
  unlabelled icon button) — that is still tracked and fixed per
  `.claude/skills/accessibility/SKILL.md`; this repo just no longer relies on the E2E suite
  to be the thing that catches it.
- **Never assert on translated copy or CSS classes as a locator.** `data-testid` sidesteps
  the exact fragility (language, restyle) that made the old approach expensive to maintain.

## Commands

```bash
pnpm test:e2e                      # every module
pnpm test:e2e login                # one module
pnpm test:e2e login user-settings  # several
pnpm test:e2e login/validation     # one aspect of one module
pnpm test:e2e -g "empty"           # by test name, across modules

pnpm test:e2e:ui login             # Playwright UI, filtered to the module
pnpm test:e2e:headed login         # watch a real browser run it
pnpm test:e2e:debug login          # step through with the inspector
pnpm test:e2e:report               # open the last HTML report

pnpm test:e2e:a11y                 # every module's a11y.spec.ts

pnpm e2e:new <module> [--public]   # scaffold a module folder
```

The positional filter is a **path** substring, so `login` also matches
`e2e/modules/login/` — that is exactly how module scoping works. `pnpm test:e2e events` runs
every spec file under that module (both `create-event.spec.ts` and `edit-event.spec.ts`),
and `pnpm test:e2e events/create-event` runs only the one flow.

**This suite is local-only — there is no CI job for it, by decision.** Run it yourself before
pushing. Two independent reasons: the captcha bypass in `src/lib/verify-captcha.ts` is
double-gated on `NODE_ENV !== 'production'`, so it only works against `pnpm dev`; and specs
create, mutate and delete real Events through one shared real account, so two concurrent runs
fight over it and leave real rows behind. `playwright.config.ts` carries no CI branches and
`retries` is 0 — a green-on-retry run against a real backend hides a flake rather than
reporting it.

**The runner starts `pnpm dev` itself and is capped at `workers: 2`.** Playwright would
otherwise default to half your CPU cores, and those workers all paying `next dev`'s
first-request route compile at once starved data-dependent UI: a page's shell rendered while
its form body did not, so specs failed on controls that existed but never became enabled
(8 workers → 5 failed; 2 → 0 failed). **Do not switch this to `pnpm build && pnpm start`** —
that sets `NODE_ENV=production`, closing the captcha gate, and every sign-in fails
`400 Captcha verification failed`. Measured: it took the events suite from 40 passing to 4.

Every command needs `.env.local` populated (see `.env.example`) — `E2E_USER_EMAIL` /
`E2E_USER_PASSWORD` are required, everything else is optional and gates the tests that need
it.

---

# The Workflow

The human or the approved spec describes a module's business flow(s); QA turns each into its
own `<flow-name>.spec.ts` — dev never does, even if dev finished the implementation first and
it would be "faster" to add the spec inline. Do not skip step 2 — that is where every
invented selector and imagined error message dies. Adding a `data-testid` a flow needs is a
`src/` change and belongs to dev (see "Locators" above) — flag it rather than editing `src/`
as QA, unless a manager has explicitly authorized crossing that line for this task.

```
1. SPEC      human writes docs/specs/<module>.md   ← the happy-path bullets, one flow per group
2. OBSERVE   drive the page with Playwright MCP    ← read the real DOM/network, not assumption
3. SCAFFOLD  pnpm e2e:new <module>
4. WRITE     <flow-name>.spec.ts per distinct business flow, data-testid locators
5. RUN       pnpm test:e2e <module>
6. REPORT    show the output; list anything the spec asked for that you could not test
```

## Step 1 — The spec is the input

`docs/specs/_TEMPLATE.module.md` is the shape. **The happy-path "Behaviour" bullets become
one spec file per distinct business flow**, named after that flow (`create-event.spec.ts`,
not `flow.spec.ts`). That is the contract: the human owns what gets tested, you own how.
Field-level validation and error-branch bullets are covered by unit tests instead (see
`.claude/skills/test-driven-development/SKILL.md`) unless the spec explicitly calls for a
real-browser guard.

If a bullet cannot become a test — "the module should feel fast", "handles errors well" —
say so and ask for a measurable version. Do not silently invent an interpretation.

If the flow needs a backend state a real account cannot reach on demand (locked, inactive,
a specific permission set), say so and ask for a dedicated test account rather than
reaching for a mock.

If the spec is missing entirely, write the behaviour list yourself from the module's code
and **get it confirmed before writing specs**. Guessing at requirements is worse than
guessing at selectors, because it looks authoritative.

## Step 2 — Observe before asserting

Full recipe in `.claude/skills/browser-verification-playwright/SKILL.md`. The short version:

1. Read the component, its hook, and the API route handler it calls.
2. `browser_navigate` then `browser_snapshot` — read the real DOM/network state, and note
   which elements need a `data-testid` added because their text/role is not a stable hook
   (translated copy, an iframe/portal, several look-alike rows).
3. Trigger the happy path for real and read the response bodies with
   `browser_network_request`.
4. `browser_console_messages` — zero errors, zero warnings.

Never write an assertion for a string you found in `vi.json` but did not see rendered.

## Step 3 — Scaffold

```bash
pnpm e2e:new customer-activation          # behind auth
pnpm e2e:new impressum --public           # no sign-in needed
```

`pnpm e2e:new` scaffolds every aspect file for backward compatibility — delete the ones you
are not writing (usually everything except the module's business-flow spec(s), per "One spec
file per business flow" above), and rename the generated `flow.spec.ts` to the actual flow
name. For an authenticated module, add the module to `MODULES` in `e2e/shared/session.ts`
first, with its href and the Vietnamese sidebar label.

## Step 4 — Write the spec

### Authenticated modules

Every module's flow spec authenticates via a direct API call — never by walking the real
login form:

```ts
await resumeSessionAt(page, 'userSettings'); // real POST /api/auth/login,
                                              // cookies land in the context,
                                              // then straight to the page
```

`resumeSessionAt` calls `authenticateViaApi`, which POSTs to `/api/auth/login` through
`page.request` — Playwright shares that cookie jar with the browser context, so the real
`Set-Cookie` response is already applied before `page.goto()` runs. It is still the real
endpoint and a real session; it just skips rendering the login page first.

**Walking the real login form is `login`'s own job, not every other module's.** The `login`
module's own flow spec (`e2e/modules/login/`) is the one place that exercises the actual
form — `signIn(page)` — because that UI is exactly what it's testing. Every other module's
flow spec has nothing to prove about the login page itself, so it costs nothing but time and
flakiness to render it first: the login form runs its own locale/redirect logic
independently of the module under test, and a slow or misconfigured redirect there (e.g. a
session landing on `/en/dashboards` instead of the locale the module spec expects) fails the
*wrong* test. Always use `resumeSessionAt` — it is still a real, unmocked sign-in, just not
UI-driven, and it is faster besides.

### Backend states a fresh sign-in cannot reach

Some tests need an account that is *already* locked, inactive, or restricted to certain
modules. Get dedicated credentials into `.env.local` and read them with the helpers in
`e2e/shared/session.ts` — `lockedCredentials()`, `inactiveCredentials()`,
`restrictedCredentials()`. Each returns `null` when its env vars are incomplete; skip the
test with a reason rather than guessing at a fixture:

```ts
const locked = lockedCredentials();
test.skip(!locked, 'Set E2E_LOCKED_USER_EMAIL / _PASSWORD in .env.local to run this.');
```

### Two traps that will cost you an hour each

**Permissions.** `use-me.ts` runs `setPermissions(permissions ?? role?.permissions ?? [])`
and `setNavbar(role?.navbar ?? [])`. The stores read `null` as *"nothing loaded yet, allow
everything"* but `[]` as *"allow nothing"*. A real account whose role genuinely has no
`navbar` entries will show only the `alwaysShow` sidebar entries — that is the app working
correctly, not a broken test. To test gating deliberately, use a real restricted account via
`restrictedCredentials()`, which also carries the comma-separated list of modules it should
see (`E2E_RESTRICTED_USER_MODULES`).

**Sidebar locators.** The breadcrumb renders the current page as
`<span role="link">DASHBOARDS</span>`, so an unscoped
`getByRole('link', { name: 'Dashboards' })` is a strict-mode violation on whichever module
you are looking at. Use `sidebarLink(page, name)`.

### Reading the real response instead of hardcoding it

A test asserting a server-driven value (an attempts-remaining count, a lockout duration)
should read it from the response and assert the UI renders *that* value, not a number you
guessed:

```ts
const loginResponse = page.waitForResponse((r) => r.url().includes('/api/auth/login'));
await login.submitWith(email, wrongPassword);
const body = await (await loginResponse).json();

await expect(login.passwordError(DE_ERRORS.attemptsRemaining(body.attemptsRemaining)))
  .toBeVisible();
```

This is stronger than a fixed expectation — it verifies the app correctly binds whatever the
backend sends, and it never goes stale when the backend's actual counter state changes
between runs.

### Console health

Attach the watcher **before** navigating, or it misses the load-time messages:

```ts
const consoleWatch = watchConsole(page);
await resumeSessionAt(page, 'userSettings');
await expect(page.getByRole('tab').first()).toBeVisible();
await consoleWatch.assertClean();
```

`assertClean()` waits for images to finish loading first. That wait is not optional: Next.js
checks image geometry inside `onload`, so an aspect-ratio warning arrives after the page is
interactive and an earlier assertion passes or fails on timing.

Because this suite hits real backend services, a console assertion can occasionally catch
genuine third-party flakiness — a 502/503 from a downstream gateway (the notification
service has been observed doing this) — that has nothing to do with the change you are
testing. Re-run once before treating a single console failure as a regression; do not
pre-filter it out of `watchConsole`, since a real app error would look identical.

## Step 5 — Run it

```bash
pnpm test:e2e <module>
pnpm test:e2e:ui <module>     # when a test fails and you want to see why
```

## Step 6 — Report honestly

Show the command output. If a spec bullet could not be tested, name it and say why — a
missing test account, an unanswered open question, a branch that needs data nobody has
provisioned yet. Silence reads as coverage.

---

## Rules

- **Folder name = route segment.** Anything else breaks `pnpm test:e2e <module>`.
- **No spec files in `e2e/shared/`.** It is harness only.
- **No spec files at the `e2e/` root.** Everything belongs to a module.
- **One spec file per business flow, named after the flow — never `flow.spec.ts`.** Every
  other aspect (`content.spec.ts`, `validation.spec.ts`, etc.) is optional — don't add one
  without a specific reason. See "One spec file per business flow" above.
- **Locators in the page object**, never inline in a spec.
- **`data-testid` first, not role/text.** See "Locators" above; add missing `data-testid`s
  to `src/` as a dev change, not a QA edit, unless explicitly authorized otherwise.
- **No `page.route()` mocking**, except simulating a network failure that no real account can
  produce (e.g. aborting a request to test a "deadline unavailable" branch) — never to fake a
  *successful* response. If a branch needs a specific real state, get a dedicated real
  account for it.
- **Read server-driven values from the response**, don't hardcode them — see "Reading the
  real response instead of hardcoding it" above.
- **Never `waitForTimeout`.** `expect(...).toBeVisible()` auto-waits.
- **Never assert Tailwind classes or translated copy as a locator.** `data-testid`, `data-*`.
- **One flow per file.** If a business-flow spec needs two unrelated `describe` blocks, that
  is a sign it is actually two flows — split it into two named spec files instead of forcing
  them together, and don't merge two genuinely separate journeys into one file either.
- **Each flow spec is self-sufficient.** Never have one flow spec depend on data or state
  left behind by another spec file — Playwright runs files independently and in any order.

## Red Flags

- A spec at `e2e/` root or inside `e2e/shared/`
- A module folder whose name does not match its route
- A spec file named `flow.spec.ts` instead of the business flow it covers
- An aspect file added without a specific reason beyond "the old template had it"
- A locator written inline in a spec instead of the page object
- A locator built on translated copy or CSS structure instead of `data-testid`
- QA adding a `data-testid` to `src/` without dev/manager sign-off
- `page.route()` used to fake a *successful* backend response
- A real account whose `permissions` / `role.navbar` you assumed instead of observed
- `signIn` (the real UI login form) used anywhere outside `login`'s own flow spec
- A flow spec that assumes an Event/record another spec file created still exists
- Scaffolded TODO specs committed still failing
- A hardcoded attempts-remaining count or lockout duration instead of one read from the response

## Verification Checklist

- [ ] `pnpm test:e2e <module>` runs only that module, and passes
- [ ] Every business flow the module has gets its own spec file, named after that flow
- [ ] Any aspect file beyond the business-flow specs has a specific, stated reason for existing
- [ ] Locators use `data-testid`, added to `src/` by dev (or an explicitly authorized QA
      change), not guessed from role/text
- [ ] No `page.route()` faking a successful response
- [ ] Server-driven assertions (counts, durations) come from the actual response
- [ ] Every flow spec authenticates via `resumeSessionAt`, except `login`'s own flow spec
- [ ] Each flow spec creates whatever data it depends on itself
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] Anything untestable — including a missing dedicated test account — is named
      explicitly in the report
