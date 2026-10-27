---
name: feature-workflow
description: The end-to-end delivery workflow for this repo — SPEC → RED → GREEN → REFACTOR → VERIFY → SYNC. Read this first for any non-trivial piece of work so you know which skill applies at which stage and what "done" means. Triggers on "new feature", "implement", "build this", "fix this bug", "change the behaviour", "how do we work here".
triggers:
  - new feature
  - implement this
  - build this
  - fix this bug
  - requirement change
  - workflow
  - how do we work
  - definition of done
---

# Feature Workflow

The standard route from a request to merged code. Each stage has one owning skill; this
file is the map, not a replacement for them.

```
 ┌── SPEC ──────┐  ┌── RED ───┐  ┌── GREEN ─┐  ┌ REFACTOR ┐  ┌ VERIFY ─┐  ┌── SYNC ──┐
 │ write the    │→ │ failing  │→ │ minimum  │→ │ clean up │→ │ browser │→ │ rules +  │
 │ spec, get    │  │ test     │  │ code to  │  │ suite    │  │ + e2e   │  │ i18n +   │
 │ it approved  │  │ first    │  │ pass     │  │ stays 🟢 │  │ spec    │  │ mirrors  │
 └──────────────┘  └──────────┘  └──────────┘  └──────────┘  └─────────┘  └──────────┘
   spec-driven-      test-driven-development      browser-verification-   agent-rules-
   development       (loop RED→GREEN→REFACTOR      playwright             sync
                      once per behaviour)
```

## Choosing the Entry Point

| Request | Start at | Skip |
|---|---|---|
| New module (own sidebar entry) | SPEC, then `nextjs-new-module` for the ordering | — |
| New feature in an existing module | SPEC | — |
| Requirement changed on existing code | RED (update the test that encodes the old behaviour) | SPEC, unless the change is large |
| Bug report | RED (reproduce it — the Prove-It pattern) | SPEC |
| Visual-only restyle, no behaviour change | VERIFY | SPEC, RED, GREEN |
| Copy / translation key only | SYNC (`en.json` + `de.json` together) | everything else |
| Typo, comment, config | just do it | everything else |

When in doubt, spend the 15 minutes on a spec. Skipping it is the expensive mistake.

## Stage 1 — SPEC

→ `.Codex/skills/spec-driven-development/SKILL.md`

List your assumptions, get them corrected, reframe anything vague into testable criteria,
write `docs/specs/<feature>.md`, and get the human's yes before writing code.

**Gate:** the human approved the spec. The behaviour bullets in it are your test names.

## Stage 2–4 — RED / GREEN / REFACTOR

→ `.Codex/skills/test-driven-development/SKILL.md`

One loop per behaviour bullet, not one loop for the whole feature:

```
for each behaviour in the spec:
    write the test          → pnpm test <file>   must FAIL, for the right reason
    write minimal code      → pnpm test <file>   must PASS
    clean up                → pnpm test          must STAY PASSING
```

Consult the pattern skills as you write the implementation — they define *how* the code
should look, while TDD defines *when* you are allowed to write it:

| Writing… | Skill |
|---|---|
| A component | `nextjs-component` |
| A query/mutation hook | `nextjs-data` |
| A form | `nextjs-form` |
| Filters, pagination, deep links | `nextjs-url` |
| Tabs | `nextjs-tab` |
| Translation keys | `nextjs-i18n` |
| Colors, buttons | `nextjs-colors`, `nextjs-button` |
| A whole new module | `nextjs-new-module` |

**Gate:** `pnpm test`, `pnpm typecheck` and `pnpm lint` all pass.

## Stage 5 — VERIFY

→ `.Codex/skills/browser-verification-playwright/SKILL.md`

Unit tests do not prove a page renders. Drive the real browser, check the console is clean,
check `/de/` and `/en/`, check dark and light, then promote the flow into `e2e/*.spec.ts`.

**Gate:** browser verified, console clean, `pnpm test:e2e` passes.

## Stage 6 — SYNC

→ `.Codex/skills/agent-rules-sync/SKILL.md`

Fan out everything that has more than one home:

- Did you learn a rule worth enforcing? → `AGENTS.md` **and** `.github/copilot-instructions.md`
  (and `AGENTS.md` if it is workflow-level)
- New i18n keys? → `en.json` **and** `de.json`
- New backend `error_code`? → the `errors` namespace in both locale files
- New shared component? → a section in `(public)/components/_sections/` **and** its
  registration in that page
- New MCP server? → `.mcp.json` **and** `.vscode/mcp.json`
- New skill? → the skills table in all three rule files

**Gate:** every mirror updated in the same change, and listed in your final message.

## Definition of Done

Not done until every one of these is true:

- [ ] The spec exists and matches what was actually built
- [ ] Every behaviour has a test that failed before the code existed
- [ ] `pnpm test` passes — output shown, not asserted from memory
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Critical flows have an `e2e/*.spec.ts` and `pnpm test:e2e` passes
- [ ] Browser-verified in both locales and both themes, console clean
- [ ] `en.json` and `de.json` both updated
- [ ] Every mirrored file is in sync
- [ ] Nothing was skipped silently — anything left out is stated explicitly, with why

## Reporting Honestly

State what you ran and what it said. "Tests pass" without output is not a result. If a
stage was skipped, name it and give the reason — "no E2E added, this is a pure helper with
no user-facing flow" is a fine answer; silence is not.
