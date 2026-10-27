---
name: e2e-module-testing
description: The E2E test structure for this repo — one folder per module under e2e/modules/, split by aspect, runnable with `pnpm test:e2e <module>`. Every spec hits the real backend, no mocking. MUST be followed when writing, moving or adding any Playwright spec, and when a human describes a module's business flow and asks for its test cases. Triggers on "write tests for module", "test the X module", "e2e structure", "add e2e test", "test cases for", "module spec".
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

One folder per module. One aspect per file. `pnpm test:e2e <module>` runs that module and
nothing else. **Every spec hits the real backend — there is no mocked mode.**

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
    │   ├── login.page.ts          page object: locators + the real visible copy
    │   ├── login.data.ts          real credentials (from env) + deliberately-wrong ones
    │   ├── flow.spec.ts           the happy path
    │   ├── validation.spec.ts     client-side validation
    │   ├── errors.spec.ts         server error branches
    │   ├── routing.spec.ts        guards, redirects, deep links
    │   └── a11y.spec.ts           axe scan + keyboard + console health
    └── user-settings/
        ├── user-settings.data.ts
        ├── flow.spec.ts
        └── content.spec.ts
```

**The folder name is the filter.** It must match the route segment — `login`,
`user-settings`, `customer-activation` — because `pnpm test:e2e user-settings` is just
`playwright test user-settings`, a substring match on the file path. Get the name wrong and
the module becomes unrunnable on its own.

### Aspects

Create only the ones the module needs. Never invent a new aspect name — the point is that
`flow.spec.ts` means the same thing in every module.

| File | Covers |
|---|---|
| `flow.spec.ts` | The business happy path. For an authenticated module, the journey: sign in → redirect → sidebar → module. |
| `content.spec.ts` | What the page renders once you are on it. Tabs, lists, empty states, data-driven text. |
| `validation.spec.ts` | Form rules. Every test also asserts the request was **not** sent. |
| `errors.spec.ts` | Server error branches, driven for real — a wrong password, or a dedicated locked/inactive test account. |
| `routing.spec.ts` | Guards, redirects, locale rewrites, URL-synced state. |
| `a11y.spec.ts` | axe scan (clean **and** with errors on screen), keyboard reachability, accessible names, console health. |

There is no `real.spec.ts` aspect — every aspect already is real.

### Non-spec files

`*.page.ts`, `*.data.ts` are helpers, not tests — `playwright.config.ts` only picks up
`**/*.spec.ts`, so they are never collected as suites.

- **`<module>.page.ts`** — the page object. All locators live here so a markup or copy
  change touches one file. Document any locator that looks odd, with the reason.
- **`<module>.data.ts`** — credentials (read from env via the helpers in
  `e2e/shared/session.ts`) and the exact strings the user sees. German, since `de` is the
  default locale.

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
`e2e/modules/login/` — that is exactly how module scoping works. `flow` runs every module's
`flow.spec.ts`, which is a useful way to smoke every journey at once.

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

The human describes a module's business flow; you turn it into test cases. Do not skip
step 2 — that is where every invented selector and imagined error message dies.

```
1. SPEC      human writes docs/specs/<module>.md   ← behaviour bullets = test names
2. OBSERVE   drive the page with Playwright MCP    ← read the real a11y tree + responses
3. SCAFFOLD  pnpm e2e:new <module>
4. WRITE     fill each aspect from 1 + 2
5. RUN       pnpm test:e2e <module>
6. REPORT    show the output; list anything the spec asked for that you could not test
```

## Step 1 — The spec is the input

`docs/specs/_TEMPLATE.module.md` is the shape. **Every bullet under "Behaviour" becomes one
test name, verbatim.** That is the contract: the human owns what gets tested, you own how.

If a bullet cannot become a test — "the module should feel fast", "handles errors well" —
say so and ask for a measurable version. Do not silently invent an interpretation.

If a bullet needs a backend state a real account cannot reach on demand (locked, inactive,
a specific permission set), say so and ask for a dedicated test account rather than
reaching for a mock.

If the spec is missing entirely, write the behaviour list yourself from the module's code
and **get it confirmed before writing specs**. Guessing at requirements is worse than
guessing at selectors, because it looks authoritative.

## Step 2 — Observe before asserting

Full recipe in `.Codex/skills/browser-verification-playwright/SKILL.md`. The short version:

1. Read the component, its hook, and the API route handler it calls.
2. `browser_navigate` then `browser_snapshot` — the accessibility tree names every element
   with the role and accessible name your locators need.
3. Trigger each branch for real and read the response bodies with
   `browser_network_request`.
4. `browser_console_messages` — zero errors, zero warnings.

Never write an assertion for a string you found in `de.json` but did not see rendered. The
login module has a live example of why: the empty-email message comes from
`fieldErrors.email`, while `login.validation.emailRequired` also exists in both locale files
and is dead code.

## Step 3 — Scaffold

```bash
pnpm e2e:new customer-activation          # behind auth
pnpm e2e:new impressum --public           # no sign-in needed
```

The generated specs fail on purpose — they are the RED step. For an authenticated module,
add the module to `MODULES` in `e2e/shared/session.ts` first, with its href and the German
sidebar label.

## Step 4 — Write the specs

### Authenticated modules

`flow.spec.ts` walks the journey through the real login form; everything else authenticates
via a direct API call instead:

```ts
await signIn(page);                          // real form, real redirect      (~4s)
await openModule(page, 'userSettings');      // clicks the sidebar entry
await resumeSessionAt(page, 'userSettings'); // real POST /api/auth/login,    (~1.5s)
                                              // cookies land in the context,
                                              // then straight to the page
```

`resumeSessionAt` calls `authenticateViaApi`, which POSTs to `/api/auth/login` through
`page.request` — Playwright shares that cookie jar with the browser context, so the real
`Set-Cookie` response is already applied before `page.goto()` runs. It is still the real
endpoint and a real session; it just skips rendering the login page first.

Walk the full UI journey **once per module**, in `flow.spec.ts`. A suite of twenty modules
must not pay for twenty full sign-in flows per assertion — `resumeSessionAt` is the fast
path precisely because it is still real, just not UI-driven.

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
- **Locators in the page object**, never inline in a spec.
- **No `page.route()` mocking.** Every test hits the real backend. If a branch cannot be
  produced by a real account, get a dedicated real account for it — do not mock the
  response.
- **Read server-driven values from the response**, don't hardcode them — see "Reading the
  real response instead of hardcoding it" above.
- **Assert German copy.** `de` is the default locale and what users see.
- **Never `waitForTimeout`.** `expect(...).toBeVisible()` auto-waits.
- **Never assert Tailwind classes.** Roles, text, `data-*`.
- **One flow per file.** If a spec file needs two `describe` blocks about different things,
  it is two aspects.

## Red Flags

- A spec at `e2e/` root or inside `e2e/shared/`
- A module folder whose name does not match its route
- An aspect file named something other than the six standard names
- A locator written inline in a spec instead of the page object
- An assertion on copy you never saw rendered
- `page.route()` used to fake a backend response
- A real account whose `permissions` / `role.navbar` you assumed instead of observed
- `signIn` in every test of a module instead of once in `flow.spec.ts`
- A console assertion with no `assertClean()` / image wait
- Scaffolded TODO specs committed still failing
- A hardcoded attempts-remaining count or lockout duration instead of one read from the response

## Verification Checklist

- [ ] `pnpm test:e2e <module>` runs only that module, and passes
- [ ] Every "Behaviour" bullet in the module spec has a test with that name
- [ ] Locators came from a real accessibility tree, not a guess
- [ ] No `page.route()` in the module — every request hits the real backend
- [ ] Server-driven assertions (counts, durations) come from the actual response
- [ ] `flow.spec.ts` signs in once via the UI; other aspects use `resumeSessionAt`
- [ ] `a11y.spec.ts` scans clean and with errors displayed
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] Anything untestable — including a missing dedicated test account — is named
      explicitly in the report
