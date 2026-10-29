---
name: test-driven-development
description: Defines who owns test files in this repo (QA owns test cases, dev owns implementation) and how the two roles hand off through docs/specs. MUST be read before touching any *.test.ts(x) or *.spec.ts file, and before implementing any behaviour change. Triggers on "new feature", "fix bug", "change behaviour", "requirement changed", "add validation", "refactor", "write test", "test case".
triggers:
  - new feature
  - implement
  - fix bug
  - bug report
  - change behaviour
  - requirement change
  - add validation
  - edge case
  - regression
  - write test
  - test case
  - refactor
source: https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md
---

# Testing Ownership — QA Owns Test Cases, Dev Owns Implementation

Test authorship has moved out of the implementation loop. **QA defines and updates every
test case — unit/component (Vitest) and E2E (Playwright) alike.** Dev implements code
against the spec and against whatever test cases already exist. Neither role edits the
other's files. This is a hard split by *task role*, not by which human happens to be
typing — see "Which Role Am I" below.

## Why This Changed

The old model had dev write the failing test and the implementation in the same loop,
adjusting the test scenario as understanding of the flow evolved. In practice that let the
test drift to match whatever the code ended up doing, instead of staying an independent
check written from the spec. Splitting authorship keeps the test honest: it is written from
the approved module spec, not from reading the implementation that's supposed to satisfy it.
Frontend specs live in `docs/specs/<feature>.md`; backend domain specs live beside the
server module at `src/server/modules/<domain>/SPEC.md`.

## The New Flow

```
 ┌────────────┐   ┌────────────────────┐   ┌───────────────────┐   ┌─────────────┐
 │   SPEC     │──▶│  QA writes/updates │──▶│  Dev implements    │──▶│  Dev runs   │
 │ docs/specs │   │  test cases        │   │  code against the  │   │  QA's tests │
 │ /<module>  │   │  (unit + e2e)      │   │  spec (no test     │   │  locally    │
 │   .md      │   │                    │   │  files touched)    │   │  (pnpm test,│
 └────────────┘   └────────────────────┘   └────────────────────┘   │ test:e2e)   │
                                                                       └─────────────┘
                                                                              │
                                                              QA re-runs later ▼
                                                              once the branch is deployed
```

Dev and QA work **in parallel off the same spec**, not sequentially: as soon as a task is
picked up, QA starts defining/updating its test cases while dev starts implementing. Dev
does not wait for QA's test files to exist before writing code — dev codes straight from
the approved module spec. Once dev's implementation is ready, dev runs whatever test cases
QA has produced so far (`pnpm test`, `pnpm test:e2e`) to self-check before handing off; QA
runs the full E2E pass for real afterwards, once the branch is deployed to an environment
they can drive.

## Which Role Am I

There is no fixed person-to-role mapping — the same human may ask for dev work in one
message and test work in the next. **Read the request, not the org chart:**

| The task asks you to… | You are in… | You may write/edit | You must NOT write/edit |
|---|---|---|---|
| Implement a feature, fix a bug, change behaviour, refactor | **Dev role** | Source under `src/`, applicable spec | `tests/**/*.test.ts(x)`, `e2e/modules/**/*.spec.ts` |
| Write/update test cases, add coverage, turn a spec into tests | **QA / Test role** | `tests/**/*.test.ts(x)`, `e2e/modules/**/*.spec.ts`, applicable spec | Implementation source under `src/` |

For backend modules, QA may edit only `src/server/modules/<domain>/SPEC.md` when updating
the behavior contract. This is the documentation exception to the rule that QA never edits
implementation source under `src/`; QA still does not edit `.ts` or `.tsx` source files.

If a request is ambiguous about which role applies, ask — don't default to "just do both."

## Dev Role — Implement, Don't Touch Tests

**Never create, edit, or delete a `*.test.ts(x)` or `*.spec.ts` file while acting as dev**,
even to fix an obviously broken selector, even to make the suite green, even if no test
exists yet for the behaviour you're building. Options when you hit a test problem:

- **No test exists yet for this behaviour** — implement straight from
  approved module spec. Do not write a placeholder or scratch test to drive your own
  work; that becomes an informal test case nobody asked you to own, and it competes with
  whatever QA will write. Verify manually (typecheck, lint, a manual run, Playwright MCP for
  UI) and say plainly that automated coverage is pending from QA.
- **An existing test looks wrong, stale, or contradicts the spec** — do not edit it. Flag it
  back (a comment to the human, a note in your summary) with exactly what looks wrong and
  why, and continue implementing against the spec. QA updates the test; you don't guess at
  the fix and you don't silently work around it.
- **Your change makes an existing test fail because the requirement genuinely changed** —
  same as above: name the test, name the behaviour that changed, and hand it back. Do not
  "fix up" the test yourself to match your new code — that is exactly the failure mode this
  split exists to prevent.

You still run the suite (`pnpm test`, `pnpm test:e2e`, `pnpm typecheck`, `pnpm lint`) to
verify your own work against whatever test cases already exist — running tests is not the
same as authoring or editing them.

## QA / Test Role — Own Every Test Case, Don't Touch Implementation

**Never edit implementation source under `src/` while acting as QA**, even a one-line fix
that would make a test pass. The only `src/` exception is the backend module's
`src/server/modules/<domain>/SPEC.md`, which QA may update as documentation when the
behavior contract changes. If implementation is wrong, report it to dev.

- Write and maintain both tiers: Vitest unit/component tests under `tests/`, and Playwright
  E2E specs under `e2e/modules/<module>/` — see `.claude/skills/e2e-module-testing/SKILL.md`
  for the E2E layout and workflow.
- Source test cases from the approved module spec — every behavior bullet becomes a test
  name. If the spec is missing or a bullet can't become a concrete assertion, that's a
  question back to the human, not a guess.
- You may run the app / dev server to observe real behaviour (`browser-verification-playwright`
  applies to you too — never write a scenario from assumption), but you do not change what
  it does.
- When you find behaviour that contradicts the spec, that's a bug to report — write the test
  to assert the *spec's* intended behaviour (it will fail against current code), don't write
  it to assert whatever the code currently happens to do.

## The Cycle (Still Applies, Split Across Roles)

```
    RED                GREEN              REFACTOR
 QA writes a      Dev writes minimal   Dev cleans up the
 test that fails ──→ code to make   ──→ implementation  ──→  (repeat, still
      │            it pass                    │              no test edits by dev)
      ▼                  ▼                    ▼
   Test FAILS        Test PASSES         Tests still PASS
```

A test that passes on its very first run proves nothing — it has not yet shown it can fail.
That confirmation is QA's job before dev starts GREEN, not dev's job to skip.

## This Repository's Commands

Use these, never a guessed default:

| Purpose | Command |
|---|---|
| Full unit/component suite | `pnpm test` |
| Watch loop while working | `pnpm test:watch` |
| One file | `pnpm test tests/lib/date-utils.test.ts` |
| One folder | `pnpm test tests/lib` |
| One test by name | `pnpm test -t "renders a native button"` |
| Coverage | `pnpm test:coverage` |
| E2E suite | `pnpm test:e2e` |
| E2E interactive | `pnpm test:e2e:ui` |
| Everything | `pnpm test:all` |
| Types | `pnpm typecheck` |
| Lint | `pnpm lint` |

## Where Tests Live

| Kind | Location | Extension | Runner |
|---|---|---|---|
| Unit / component | `tests/`, mirroring the `src/` tree | `*.test.ts` / `*.test.tsx` | Vitest + jsdom |
| E2E | `e2e/modules/<module>/` | `*.spec.ts` | Playwright |

**`src/` holds source only.** No test file lives next to the code it covers — tests mirror
the source path under `tests/` instead, so browsing a feature folder shows the feature and
nothing else, and a whole suite can be moved or excluded by path.

The two extensions are also kept distinct, so neither runner ever picks up the other's
files and `expect` always comes from the right library.

```
src/lib/date-utils.ts
tests/lib/date-utils.test.ts                     ← mirrors the source path

src/shared/components/ui/button.tsx
tests/shared/components/ui/button.test.tsx

src/features/reporting-tool/trade-fair-event-form/(helpers)/
  trade-fair-event-form-mapper.ts
tests/features/reporting-tool/trade-fair-event-form/(helpers)/
  trade-fair-event-form-mapper.test.ts           ← parens folders mirror verbatim

tests/setup.ts                                   ← jsdom stubs, not a test
e2e/modules/login/flow.spec.ts                   ← E2E
e2e/modules/login/login.page.ts                  ← page object, not a test
```

**Finding the test for a file:** take its path, swap `src/` for `tests/`, add `.test`.
Imports use the `@/` alias, so a moved test needs no relative-path edits.

## What to Test in This Codebase

The architecture puts logic in specific places. Test those; skip the rest.

| Target | Test it? | Why |
|---|---|---|
| `(helpers)/*-schema.ts` — zod schemas | **Yes** | Validation rules are behaviour. Assert both accept and reject. |
| `(helpers)/*-mapper.ts` — API → form mappers | **Yes** | This is where the null/`{}` defensive guards live. Feed it a malformed payload. |
| `(helpers)/*-constants.ts` — status transition graphs, lookups | **Yes** | Pure data + pure lookups, cheap to pin. |
| `src/lib/*` — `date-utils`, `utils`, `get-error-message` | **Yes** | Shared by everything; a regression here is repo-wide. |
| `(hooks)/use-*-data.ts` — query hooks | **Component test** | Test through the component that renders it, with a mocked `apiProxy`, not the hook in isolation. |
| `(components)/*.tsx` — behaviour (disabled states, conditional rows, empty states) | **Yes** | Render it and assert what the user sees. |
| `(components)/*-skeleton.tsx` | No | Pure markup, no behaviour. |
| Tailwind classes / exact colors | No | Styling is not behaviour. Assert `data-*` attributes if you must pin a variant. |
| Anything from `radix-ui`, `next-intl`, TanStack Query itself | No | Never test third-party code. |
| A real user journey across pages (login → navigate → submit) | **E2E** | Only the critical paths — E2E is the slowest, most fragile tier. |

## RED — QA Writes the Failing Test

A real target from this repo: `mapTradeFairEventToFormValues` in
`src/features/reporting-tool/trade-fair-event-form/(helpers)/trade-fair-event-form-mapper.ts`
carries both defensive guards this codebase depends on — `Array.isArray(event.attachments)`
and `event.location?.city`. Those guards are behaviour, so QA gives them tests, sourced from
the mapper's documented behaviour in the spec/CONTEXT.md, not from reading the mapper itself:

```ts
// tests/features/reporting-tool/trade-fair-event-form/(helpers)/
//   trade-fair-event-form-mapper.test.ts
import { describe, expect, it } from 'vitest';

// Always the `@/` alias — a test under tests/ is not next to the file it covers.
import { mapTradeFairEventToFormValues } from '@/features/reporting-tool/trade-fair-event-form/(helpers)/trade-fair-event-form-mapper';

describe('mapTradeFairEventToFormValues', () => {
  it('falls back to an empty image list when the API sends {} instead of []', () => {
    const form = mapTradeFairEventToFormValues({
      ...baseEvent,
      attachments: {} as never,
    });

    expect(form.images).toEqual([]);
  });

  it('leaves the address fields blank when the event has no location', () => {
    const form = mapTradeFairEventToFormValues({ ...baseEvent, location: null as never });

    expect(form.eventLocation).toBe('');
    expect(form.city).toBeUndefined();
  });
});
```

QA runs it and confirms it fails, and **reads the failure message** — it must fail because
the behaviour is missing, not because of a typo in the import path. A test that fails for
the wrong reason gives dev a false GREEN the moment the typo is fixed.

## GREEN — Dev Writes Minimal Code to Pass

Dev picks up the (already-failing, already-committed) test QA wrote and implements just
enough to satisfy it — without editing the test file itself:

```ts
images: (Array.isArray(event.attachments) ? event.attachments : []).map(/* … */),
eventLocation: event.location?.id || '',
city: event.location?.city,
```

Do not build the whole feature here. Just enough to turn the test green. If the test can't
be satisfied as written because it actually encodes a wrong assumption, that's a finding to
hand back to QA (see "Dev Role" above) — not something to edit.

## REFACTOR — Dev Cleans Up

Improve naming, extract shared logic, remove duplication — in `src/` only. Re-run the suite
(`pnpm test`) after each refactor step; dev does not touch the test files during this step
either. If the suite goes red during a refactor, the refactor changed behaviour — revert it,
do not "fix" the test.

## Bug Fixes — The Prove-It Pattern

When a bug arrives, QA (not dev) reproduces it in a test first:

```
Bug report ──→ QA writes a test that demonstrates it ──→ Test FAILS (bug confirmed)
                                                              │
                        Full suite passes ←── Test PASSES ←── Dev implements the fix
```

If QA cannot write a test that fails, the bug is not understood yet — that's a question
back to whoever reported it, not a guess. Dev implementing a bug fix with no reproduction
test from QA yet should still fix the root cause against the bug report, and say plainly
that the fix has no automated regression test until QA adds one.

## Requirement Changes

A changed requirement is a changed behaviour, so it takes the same route, split the same way:

1. QA finds the existing test that encodes the **old** behaviour and updates it to assert
   the **new** behaviour (from the updated spec). It should now fail.
2. Dev changes the implementation until QA's updated test passes.
3. Dev runs the full suite — a requirement change often invalidates neighbouring assumptions
   dev doesn't own tests for either, so any other failure gets flagged back to QA the same way.

Never let dev change the implementation first and then "fix up" the tests to match. That
path produces tests that assert whatever the code happens to do — which is precisely the
failure mode this split is designed to prevent.

## Component Tests — Project Patterns (QA)

`tests/setup.ts` already stubs `matchMedia`, `ResizeObserver`, `IntersectionObserver`
and the pointer-capture APIs that Radix needs, and runs RTL `cleanup()` after each test.

The reference example in this repo is `tests/shared/components/ui/button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '@/shared/components/ui/button';

it('disables itself and hides the label while loading', () => {
  render(<Button isLoading>Speichern</Button>);

  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.queryByText('Speichern')).not.toBeInTheDocument();
});
```

- **Query by role, then by label, then by text.** Never by CSS class — classes are styling,
  and this repo's rules already forbid asserting on them.
- **A component under `useTranslations` needs a provider.** Wrap it in
  `NextIntlClientProvider` with the real `de.json` messages rather than mocking next-intl —
  the real messages catch missing keys, which is a bug class this repo cares about.
- **A component using `useQuery` needs a `QueryClientProvider`** with
  `retry: false` so a failing request fails fast instead of retrying through the timeout.
- **Mock at the `apiProxy` boundary**, not at the hook. `vi.mock('@/lib/api-client')` keeps
  the hook, the query key and the interceptor contract under test.
- **nuqs-driven components need `NuqsTestingAdapter`** from `nuqs/adapters/testing`.

## Writing Good Tests

**Test state, not interactions.** Assert on the outcome, not on which internal methods ran.
Interaction tests break on every refactor even when behaviour is unchanged.

```ts
// ✅ Tests what it does
expect(sorted[0].createdAt.getTime()).toBeGreaterThan(sorted[1].createdAt.getTime());

// ❌ Tests how it does it
expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY'));
```

**DAMP over DRY.** In tests, readable repetition beats a clever shared helper. Each test
should tell its whole story without the reader jumping to a `beforeEach`.

**Prefer real implementations.** Preference order: real → fake (in-memory) → stub → mock.
Mock only what is slow, non-deterministic, or has side effects you cannot control (network,
time, `crypto.randomUUID`). Over-mocking produces tests that pass while production breaks.

**Arrange–Act–Assert**, one concept per test, and names that read like a specification:

```ts
// ✅ Reads like a spec
it('sets completedAt when a task is completed', ...)
it('throws NotFoundError for a non-existent task', ...)

// ❌ Vague
it('works', ...)
it('handles errors', ...)
```

## Anti-Patterns

| Anti-pattern | Problem | Fix |
|---|---|---|
| Testing implementation details | Breaks on every refactor | Assert inputs and outputs |
| Flaky / order-dependent tests | Erodes trust in the whole suite | Each test sets up and tears down its own state |
| Testing framework behaviour | Wastes effort on third-party code | Only test your own code |
| Snapshot abuse | Nobody reviews a 400-line snapshot diff | Assert the specific thing that matters |
| Mocking everything | Green tests, broken production | Mock only at slow / non-deterministic boundaries |
| Asserting on Tailwind classes | Styling churn breaks tests | Assert roles, text, `data-*` attributes |
| `test.skip` to get a green run | Hides a real failure | Fix it or delete it, and say so |

## Browser Verification

Unit tests cannot see a rendered page. For anything visual or flow-based, pair TDD with the
Playwright MCP loop in `.claude/skills/browser-verification-playwright/SKILL.md`, then
promote what you verified into a durable `e2e/*.spec.ts`.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll write the tests after it works" (QA) | You won't, and after-the-fact tests assert the implementation, not the requirement. |
| "I'll just tweak the test to fit my code" (dev) | That's editing a file you don't own, and it's the exact drift this split exists to stop. Flag it to QA instead. |
| "This is too simple to test" | Simple code gets complicated. The test documents the intent. |
| "I checked it in the browser" | Manual checks don't persist. Tomorrow's change breaks it silently. |
| "It's just a UI tweak" | If it changes what the user can do, it's behaviour. If it only changes how it looks, it isn't — skip the test and say why. |
| "Let me run the suite again to be sure" | After a clean run with no intervening edit, re-running adds nothing. |
| "There's no test yet, I'll write one to drive my own work" (dev) | Not your file. Implement from the spec, verify manually, and say automated coverage is pending from QA. |

## Red Flags

- Dev creating, editing, or deleting any `*.test.ts(x)` or `*.spec.ts` file
- QA editing implementation source under `src/` to make a test pass
- Writing implementation code with no spec and no existing test to aim at
- A test that passed the first time it ran
- Claiming "all tests pass" without a command's output to show for it
- A bug fix with no reproduction test and no note that QA coverage is pending
- `pnpm test` guessed as `npm test` or `yarn test`
- Deleting or skipping a failing test to get the suite green
- Tests that assert on class names or DOM structure instead of behaviour
- Dev "fixing up" a test to match new code instead of flagging it back to QA

## When This Split Does Not Apply

Skip test-case authorship entirely (neither role needs to act) for: pure copy/translation-key
edits, Tailwind-only restyling with no behaviour change, config files, documentation, and
dependency bumps. Everything else that changes behaviour gets a QA test case, present or
pending.

## Verification Checklist

### Dev role
- [ ] No `*.test.ts(x)` or `*.spec.ts` file was created, edited, or deleted
- [ ] Implementation follows the approved module spec, not a guess
- [ ] `pnpm test` and `pnpm test:e2e` were run (not authored) against existing QA test cases, output shown
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] Any test that looked wrong, stale, or contradicted the spec was flagged back to QA, not edited
- [ ] Behaviour with no QA test case yet is named explicitly as pending coverage

### QA / test role
- [ ] No implementation source under `src/` was created, edited, or deleted by QA
- [ ] Every "Behaviour" bullet in the spec has a matching test name
- [ ] Each new/updated test was confirmed to fail for the right reason before implementation existed or was expected to satisfy it
- [ ] Test names describe the behaviour, not the function name
- [ ] Bug reports include a reproduction test; requirement changes update the test encoding the old behaviour
