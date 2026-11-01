---
name: spec-driven-development
description: Writes a reviewable spec before any code. Use when starting a new feature or module, when requirements are vague or only exist as a sentence, when the change spans multiple files, or when an architectural decision is involved. Triggers on "new feature", "new module", "build X", "requirements", "spec", "plan this out".
triggers:
  - new feature
  - new module
  - build a
  - requirements
  - write a spec
  - plan this
  - architecture decision
  - ambiguous requirement
  - refactor multiple files
source: https://github.com/addyosmani/agent-skills/blob/main/skills/spec-driven-development/SKILL.md
---

# Spec-Driven Development

Write a structured specification before writing any code. The spec is the shared source of
truth between you and the human — it says what we are building, why, and how we will know
it is done. Code without a spec is guessing, and guessing at scale is rework.

## When to Use

- Starting a new feature or a new top-level module
- Requirements arrived as one sentence in a chat message
- The change touches more than ~3 files, or crosses feature folders
- An architectural decision is involved (new store, new API module, new shared component)
- The work would take more than 30 minutes

**Skip it for:** typo fixes, single-line changes, translation-key edits, and anything where
the requirement is already unambiguous and self-contained. A two-line spec is still a spec —
short is fine, absent is not.

## The Gated Workflow

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human    TDD cycle
 approves   approves approves per task
```

Do not advance a phase until the current one is validated by the human. The whole value of
a spec is that it surfaces a misunderstanding *before* the code exists.

## Phase 1 — Specify

### Surface assumptions first

Before writing any spec content, state what you are assuming. Assumptions are the most
dangerous form of misunderstanding because they are invisible:

```
ASSUMPTIONS:
1. This is a new top-level module (own sidebar entry), not a tab inside CAM
2. It is permission-gated and needs a ModuleKey in permissions.ts
3. Data comes from the `cam` backend module via the catch-all proxy
4. List state (page, search, status filter) is URL state via nuqs, not zustand
5. Vietnamese is the primary locale — copy will be written vi-first, en second
→ Correct me now or I proceed with these.
```

Never silently fill in an ambiguous requirement.

### Reframe vague requirements as testable criteria

```
REQUIREMENT: "make the activation list faster"

REFRAMED:
- The list renders its first row in < 1s on a warm cache
- Filtering by status does not refetch (nuqs updates queryKey, TanStack serves cache)
- No layout shift while loading — skeleton matches final row height
→ Are these the right targets?
```

"Faster" is not something you can finish. The reframed version is.

### Where specs live

Keep the spec with the code it describes:

- UI and frontend feature specs: `docs/specs/<feature-name>.md`.
- Backend domain specs: `src/server/modules/<domain>/SPEC.md`, beside the module.
- Cross-cutting backend architecture: `src/server/SPEC.md`.

Commit the spec alongside the implementation. For backend modules, `SPEC.md` is a
documentation file colocated with source; it is not implementation code or a test file.

### Spec template

```markdown
# Spec: <Feature Name>

## Objective
What we're building and why. Who uses it. What success looks like.

## Assumptions
The list you surfaced above, after the human corrected it.

## Scope
- In scope: ...
- Out of scope: ...   ← as important as "in scope"

## UX / Behaviour
Each user-visible behaviour as a bullet. These become test names verbatim.
- An empty list shows the <Empty> state with <icon>, title, description
- Submitting with an invalid email shows the fieldErrors.email message
- A 403 from the API shows the errors.FORBIDDEN toast, no crash

## Data
- Endpoints: METHOD /path → response shape
- Which backend module (core / tf / cam / etr / notification)
- Nullable relations and list fields that need Array.isArray guards
- Query keys and what invalidates them

## Architecture
- Feature folder layout: (helpers) / (hooks) / (components)
- New shared components (and their showcase section)
- New i18n namespace + keys, in both en.json and vi.json
- New permission keys, if gated

## Testing Strategy (QA owns the test files; this section states what QA should cover)
- Unit: which helpers/mappers/schemas
- Component: which behaviours, with which providers
- E2E: which single critical path, if any

## Boundaries
- Always: dev implements against this spec without touching test files; QA owns every test
  case (unit + e2e) in parallel; update en.json + vi.json together; run pnpm test before done
- Ask first: new dependency, new backend module prefix, schema-shaped API change
- Never: commit secrets, skip a failing test, hardcode strings or colors in JSX, dev editing
  a test file, QA editing implementation source under `src/`

## Success Criteria
Specific, testable conditions. If you cannot write a test for it, it is not a criterion.

## Open Questions
Anything still needing human input. Do not proceed past a blocking one.
```

### The six areas that are already answered

This repo already documents its own tech stack, commands, project structure, and code style
in `CLAUDE.md`. **Do not re-specify them per feature** — reference them instead. A feature
spec only needs to cover what is specific to that feature. That is why the template above
leads with Objective and Behaviour rather than "Tech Stack".

## Phase 2 — Plan

With the spec approved, write the technical plan:

1. Major components and their dependencies
2. Implementation order — what must exist before what
3. Risks and how each is mitigated
4. What can be built in parallel vs. what is strictly sequential
5. Verification checkpoint after each step

The plan must be reviewable: the human should be able to read it and say "yes" or "no,
change X" without reading any code.

For a brand-new top-level module, the order is not yours to choose —
`.claude/skills/nextjs-new-module/SKILL.md` prescribes the exact sequence that keeps the app
buildable at every step. Follow it.

## Phase 3 — Tasks

Break the plan into discrete, verifiable tasks:

- Each completable in a single focused session
- Each touching no more than ~5 files
- Each with explicit acceptance criteria and a verification command
- Ordered by dependency, not by perceived importance

```markdown
- [ ] Task (QA): Write the failing test for a null-location payload
  - Acceptance: A test asserting `location: null` maps to blank address fields exists and
    fails before the guard is implemented
  - Verify: pnpm test src/features/reporting-tool/trade-fair-event-form/(helpers)/trade-fair-event-form-mapper.test.ts  (fails)
  - Files: trade-fair-event-form-mapper.test.ts

- [ ] Task (Dev): Guard the trade-fair event mapper against a null location
  - Acceptance: A payload with `location: null` maps to blank address fields, no throw
  - Verify: pnpm test src/features/reporting-tool/trade-fair-event-form/(helpers)/trade-fair-event-form-mapper.test.ts  (passes, file not edited)
  - Files: trade-fair-event-form-mapper.ts
```

Track the list with the todo tool so the human can watch progress.

## Phase 4 — Implement

Dev and QA start the task list **in parallel**, not sequentially — see the role split in
`.claude/skills/test-driven-development/SKILL.md`. The behaviour bullets under "UX /
Behaviour" are the shared contract: QA turns each into a test case (unit/component and
E2E), dev implements each against the same bullets. Dev does not wait for QA's test files
to land first, and neither role edits the other's files.

Verify anything visual manually through
`.claude/skills/browser-verification-playwright/SKILL.md` before calling a dev task done;
promoting that verification into a committed `e2e/*.spec.ts` is QA's write, not dev's.

## Keeping the Spec Alive

- **Decision changed?** Update the spec first, then the code.
- **Scope changed?** Reflect it in the spec, including what got cut.
- **Commit the spec** — it belongs in version control with the code it describes.
- **Reference it in the PR** — link the spec section each commit implements.

An outdated spec is still more useful than no spec, but a spec updated as you go is what
makes the next person's change safe.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "This is simple, it doesn't need a spec" | Simple work needs a *short* spec, not no spec. Acceptance criteria alone are enough. |
| "I'll write the spec after" | That's documentation. The spec's value is forcing clarity before code. |
| "The spec will slow us down" | 15 minutes of spec beats 15 hours of rework. |
| "Requirements will change anyway" | Which is why it's a living document, updated in place. |
| "The user knows what they want" | Every clear request carries implicit assumptions. The spec surfaces them. |

## Red Flags

- Starting to write code with no written requirement anywhere
- Asking "shall I start building?" before defining what "done" means
- Implementing something that appears in no spec and no task
- Making an architectural decision without recording why
- A success criterion you cannot write a test for

## Verification Checklist

- [ ] Assumptions were listed and the human corrected or confirmed them
- [ ] Vague requirements were reframed into testable criteria
- [ ] The spec is saved in the correct home (UI: `docs/specs/`; backend domain:
      `src/server/modules/<domain>/SPEC.md`; cross-cutting server: `src/server/SPEC.md`)
      and committed
- [ ] In-scope **and** out-of-scope are both written down
- [ ] Every behaviour bullet maps to a planned test
- [ ] Boundaries (Always / Ask first / Never) are defined
- [ ] Open questions are resolved, or explicitly marked as non-blocking
