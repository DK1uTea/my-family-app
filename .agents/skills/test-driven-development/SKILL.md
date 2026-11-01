---
name: test-driven-development
description: Drives development with tests. MUST be followed for any behaviour change — implementing a feature, fixing a bug, changing a requirement, or modifying existing logic. Write the failing test first, then the code. Triggers on "new feature", "fix bug", "change behaviour", "requirement changed", "add validation", "refactor".
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
  - refactor
source: https://github.com/addyosmani/agent-skills/blob/main/skills/test-driven-development/SKILL.md
---

# Test-Driven Development

Every behaviour change requires a failing test first. Tests are proof — "seems right" is
not done. **Never skip tests unless the human explicitly instructs you to.**

## The Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation  ──→  (repeat)
      │                  │                    │
      ▼                  ▼                    ▼
   Test FAILS        Test PASSES         Tests still PASS
```

A test that passes on its very first run proves nothing — you have not yet shown it can
fail. Confirm RED before writing any implementation.

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

## RED — Write the Failing Test

A real target from this repo: `mapTradeFairEventToFormValues` in
`src/features/reporting-tool/trade-fair-event-form/(helpers)/trade-fair-event-form-mapper.ts`
carries both defensive guards this codebase depends on — `Array.isArray(event.attachments)`
and `event.location?.city`. Those guards are behaviour, so they get tests:

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

Run it. Confirm it fails, and **read the failure message** — it must fail because the
behaviour is missing, not because of a typo in the import path. A test that fails for the
wrong reason gives a false GREEN the moment you fix the typo.

## GREEN — Minimum Code to Pass

```ts
images: (Array.isArray(event.attachments) ? event.attachments : []).map(/* … */),
eventLocation: event.location?.id || '',
city: event.location?.city,
```

Do not build the whole feature here. Just enough to turn the test green.

## REFACTOR — Clean Up

Improve naming, extract shared logic, remove duplication. Re-run the suite after each
refactor step. If the suite goes red during a refactor, the refactor changed behaviour —
revert it, do not "fix" the test.

## Bug Fixes — The Prove-It Pattern

When a bug arrives, **do not start by fixing it.** Start by reproducing it in a test.

```
Bug report ──→ Write a test that demonstrates it ──→ Test FAILS (bug confirmed)
                                                          │
                     Full suite passes ←── Test PASSES ←── Implement the fix
```

If you cannot write a test that fails, you have not understood the bug yet. Keep
investigating instead of guessing at a fix.

## Requirement Changes

A changed requirement is a changed behaviour, so it takes the same route:

1. Find the existing test that encodes the **old** behaviour.
2. Update that test to assert the **new** behaviour. It should now fail.
3. Change the implementation until it passes.
4. Run the full suite — a requirement change often invalidates neighbouring assumptions.

Never change the implementation first and then "fix up" the tests to match. That path
produces tests that assert whatever the code happens to do.

## Component Tests — Project Patterns

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
  `NextIntlClientProvider` with the real `vi.json` messages rather than mocking next-intl —
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
Playwright MCP loop in `.Codex/skills/browser-verification-playwright/SKILL.md`, then
promote what you verified into a durable `e2e/*.spec.ts`.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll write the tests after it works" | You won't. And after-the-fact tests assert the implementation, not the requirement. |
| "This is too simple to test" | Simple code gets complicated. The test documents the intent. |
| "Tests slow me down" | They slow you down once, and speed you up every time the code changes. |
| "I checked it in the browser" | Manual checks don't persist. Tomorrow's change breaks it silently. |
| "It's just a UI tweak" | If it changes what the user can do, it's behaviour. If it only changes how it looks, it isn't — skip the test and say why. |
| "Let me run the suite again to be sure" | After a clean run with no intervening edit, re-running adds nothing. |

## Red Flags

- Writing implementation code before any test exists
- A test that passed the first time it ran
- Claiming "all tests pass" without a command's output to show for it
- A bug fix with no reproduction test
- `pnpm test` guessed as `npm test` or `yarn test`
- Deleting or skipping a failing test to get the suite green
- Tests that assert on class names or DOM structure instead of behaviour

## When TDD Does Not Apply

Skip it — and say that you skipped it and why — for: pure copy/translation-key edits,
Tailwind-only restyling with no behaviour change, config files, documentation, and
dependency bumps. Everything else gets a test first.

## Verification Checklist

- [ ] Each new behaviour has a test that failed before the implementation existed
- [ ] Bug fixes include a reproduction test that failed first
- [ ] `pnpm test` passes, with the output shown
- [ ] `pnpm typecheck` and `pnpm lint` pass
- [ ] E2E-worthy flows have an `e2e/*.spec.ts` and `pnpm test:e2e` passes
- [ ] No test was skipped, disabled, or deleted to reach green
- [ ] Test names describe the behaviour, not the function name
