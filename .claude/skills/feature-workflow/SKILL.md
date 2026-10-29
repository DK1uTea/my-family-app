---
name: feature-workflow
description: The end-to-end delivery workflow for this repo — SPEC → DEV/QA (parallel) → VERIFY → SYNC. Read this first for any non-trivial piece of work so you know which skill applies at which stage, which role you're in, and what "done" means. Triggers on "new feature", "implement", "build this", "fix this bug", "change the behaviour", "how do we work here".
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

**Test authorship is not a dev step.** QA owns every test case (unit, component, and E2E);
dev owns implementation only. The two work **in parallel off the same approved spec**, not
one after the other — full split in `.claude/skills/test-driven-development/SKILL.md`.

```
 ┌── SPEC ──────┐   ┌── DEV ────────────┐   ┌ VERIFY ─┐   ┌── SYNC ──┐
 │ write the    │─┬→│ implement against │──→│ browser │──→│ rules +  │
 │ spec, get    │ │ │ the spec, no test │   │ + e2e   │   │ i18n +   │
 │ it approved  │ │ │ files touched     │   │ spec    │   │ mirrors  │
 │              │ │ └────────────────────┘  └─────────┘   └──────────┘
 │              │ └┬── QA (parallel) ────┐
 │              │  │ write/update every  │
 │              │  │ test case, run full │
 │              │  │ suite once deployed │
 └──────────────┘  └─────────────────────┘
   spec-driven-       test-driven-development       browser-verification-   agent-rules-
   development         (role split: dev implements,   playwright              sync
                        QA owns every test file)
```

## Choosing the Entry Point

| Request | Start at | Skip |
|---|---|---|
| New module (own sidebar entry) | SPEC, then `nextjs-new-module` for the ordering | — |
| New feature in an existing module | SPEC, then dev and QA start in parallel | — |
| Requirement changed on existing code | QA updates the test encoding the old behaviour; dev updates the implementation | SPEC, unless the change is large |
| Bug report | QA reproduces it (the Prove-It pattern); dev fixes it against the report | SPEC |
| Visual-only restyle, no behaviour change | VERIFY | SPEC, dev/QA test authorship |
| Copy / translation key only | SYNC (`en.json` + `de.json` together) | everything else |
| Typo, comment, config | just do it | everything else |

When in doubt, spend the 15 minutes on a spec. Skipping it is the expensive mistake.

## Which Role Am I

The task tells you the lane — see "Which Role Am I" in
`.claude/skills/test-driven-development/SKILL.md` for the full table. Short version: asked
to implement/fix/refactor → dev, touch implementation source only, never a test file. Asked
to write/update test cases or coverage → QA, touch test files and the applicable spec only;
QA never edits implementation source. A backend module's `SPEC.md` is the documentation
exception because it lives under `src/server/modules/`.

## Stage 1 — SPEC

→ `.claude/skills/spec-driven-development/SKILL.md`

List your assumptions, get them corrected, reframe anything vague into testable criteria,
write the spec in its canonical home, and get the human's yes before writing code. UI
feature specs live in `docs/specs/<feature>.md`; backend domain specs live beside their
module at `src/server/modules/<domain>/SPEC.md`; cross-cutting backend specs live at
`src/server/SPEC.md`.

**Gate:** the human approved the spec. The behaviour bullets in it are QA's test names and
dev's implementation checklist — the same list, two owners.

## Stage 2 — DEV and QA, in Parallel

→ `.claude/skills/test-driven-development/SKILL.md`

Both start from the same approved spec, at the same time — dev does not wait for QA's test
files to exist:

```
DEV (per behaviour in the spec):
    implement           → against the approved module spec, no test files touched
    self-check          → pnpm test / pnpm test:e2e against whatever QA has so far
    flag, don't fix     → any test that looks wrong or stale goes back to QA

QA (per behaviour in the spec):
    write/update test    → pnpm test <file> / pnpm test:e2e <module>   must FAIL first
    confirm RED          → for the right reason, not a typo
    re-run once deployed → full pass against the real implementation, for real
```

Consult the pattern skills as dev writes the implementation — they define *how* the code
should look:

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

**Gate (dev):** `pnpm typecheck`, `pnpm lint` pass, and `pnpm test`/`pnpm test:e2e` pass
against whatever QA test cases exist at handoff time — with any gap named explicitly.
**Gate (QA):** every behaviour bullet has a test case that failed for the right reason
before being confirmed against the implementation.

## Stage 3 — VERIFY

→ `.claude/skills/browser-verification-playwright/SKILL.md`

Unit tests do not prove a page renders. Drive the real browser, check the console is clean,
check `/de/` and `/en/`, check dark and light. Promoting an observed flow into
`e2e/*.spec.ts` is QA's write, same as any other test file — dev verifies visually here but
does not add the spec file.

**Gate:** browser verified, console clean, `pnpm test:e2e` passes against QA's specs.

## Stage 4 — SYNC

→ `.claude/skills/agent-rules-sync/SKILL.md`

Fan out everything that has more than one home:

- Did you learn a rule worth enforcing? → `CLAUDE.md` **and** `.github/copilot-instructions.md`
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
- [ ] Dev touched no test file; QA touched no implementation source under `src/`
- [ ] Every behaviour has a QA test case — present, or explicitly named as pending
- [ ] `pnpm test` passes — output shown, not asserted from memory
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` succeeds
- [ ] Critical flows have an `e2e/*.spec.ts` (QA-authored) and `pnpm test:e2e` passes
- [ ] Browser-verified in both locales and both themes, console clean
- [ ] `en.json` and `de.json` both updated
- [ ] Every mirrored file is in sync
- [ ] Nothing was skipped silently — anything left out is stated explicitly, with why

## Reporting Honestly

State what you ran and what it said. "Tests pass" without output is not a result. If a
stage was skipped, name it and give the reason — "no E2E added, this is a pure helper with
no user-facing flow" is a fine answer; silence is not.
