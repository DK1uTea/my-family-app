---
name: agent-rules-sync
description: Keeps every AI agent's rule file in sync. MUST be followed whenever you add, change, or delete a project rule, convention, skill, slash command, or MCP server — so a rule written by Codex is also seen by GitHub Copilot, Cursor, Codex and every other agent on the team. Triggers on "update the rules", "add a rule", "update AGENTS.md", "update the skill", "new convention", "sync instructions".
triggers:
  - update rule
  - update rules
  - add a rule
  - new convention
  - update AGENTS.md
  - update copilot-instructions
  - update AGENTS.md
  - update skill
  - new skill
  - install skill
  - add mcp server
  - sync agent instructions
---

# Agent Rules Sync

The team does not all use the same AI agent. One person runs Codex, another runs
GitHub Copilot in VS Code, another Cursor or Codex. A rule that only lands in `AGENTS.md`
is a rule that **half the team's agents will violate**, and the violation shows up as a
code review comment days later.

**Therefore: a rule change is not done until every agent-facing file carries it, in the
same change.** Never in a follow-up commit, never "I'll do the mirror after".

## The Registry

These are all the agent-facing files in this repo. Any edit to one requires checking all
of them.

| File / folder | Read by | Role |
|---|---|---|
| `AGENTS.md` | Codex | **Canonical** — the full rule set, longest form |
| `.github/copilot-instructions.md` | GitHub Copilot (VS Code + github.com) | Full mirror of `AGENTS.md` |
| `AGENTS.md` | Cursor, Codex, Gemini CLI, Copilot agent mode, Jules, Amp | Short entry point that points at the canonical files |
| `.Codex/skills/<name>/SKILL.md` | Any agent (referenced by path from all three files above) | Deep-dive procedures — single copy, no mirror needed |
| `.omc/skills/<name>/SKILL.md` | OMC | Next.js pattern skills |
| `.Codex/commands/<name>.md` | Codex slash commands | Condensed mirror of the matching `.omc` skill |
| `.mcp.json` | Codex | MCP servers |
| `.vscode/mcp.json` | VS Code / Copilot agent mode | Same MCP servers, VS Code schema |

Skills are referenced **by path**, never copied. That is deliberate — one copy of a
procedure cannot drift from itself.

## The Protocol

```
Rule / skill / MCP change requested
            │
            ▼
1. CLASSIFY the change  ──→  see the routing table below
            │
            ▼
2. EDIT the canonical file
            │
            ▼
3. MIRROR into every other file the routing table names
            │
            ▼
4. VERIFY  ──→  grep the new wording across all targets
            │
            ▼
5. REPORT  ──→  list every file touched
```

### Step 1 — Routing table

| What changed | Files that MUST be updated together |
|---|---|
| A coding rule / convention / "never do X" | `AGENTS.md` + `.github/copilot-instructions.md` (and `AGENTS.md` only if it is a top-level workflow rule) |
| A new `.Codex/skills/*` skill | The skill file + a one-line row in the skills table of `AGENTS.md`, `.github/copilot-instructions.md`, `AGENTS.md` |
| An existing `.Codex/skills/*` skill's content | Just that file — unless the change contradicts something written in `AGENTS.md`/`copilot-instructions.md`, in which case fix those too |
| An `.omc/skills/*` skill | That file + `.Codex/commands/<same-name>.md` |
| A new MCP server | `.mcp.json` + `.vscode/mcp.json` + a line in the MCP section of all three rule files |
| A new npm script the agent should run | `package.json` + the Commands section of `AGENTS.md`, `.github/copilot-instructions.md`, `AGENTS.md` |
| An externally-sourced skill (installed from a URL/repo) | The skill file + an entry in `skills-lock.json` recording `source` and `sourceType` |

### Step 2 — Edit the canonical file

`AGENTS.md` is canonical for coding rules. Write the rule there first, in full, with the
reason and a code example if the rule is easy to misread.

### Step 3 — Mirror

`.github/copilot-instructions.md` is a **full mirror**, not a summary. It may compress
prose, but it must never *omit* a rule and must never *contradict* `AGENTS.md`. Copilot
users get no second chance to read the long version.

`AGENTS.md` is a **pointer**, not a mirror. Add to it only what an agent needs before it
knows which file to open: the workflow, the commands, the hard constraints, and where the
full rules live. Resist growing it into a third copy.

### Step 4 — Verify

Prove the mirror landed rather than assuming it:

```bash
# Every target should return a hit
grep -rn "<distinctive phrase from the new rule>" AGENTS.md .github/copilot-instructions.md AGENTS.md
```

If a target is missing the phrase, the sync is incomplete — go back to step 3.

### Step 5 — Report

End the turn by listing every file you touched, so the human can see the fan-out was done:

```
Rule updated in:
  - AGENTS.md
  - .github/copilot-instructions.md
  - AGENTS.md
```

## Writing a Rule That Survives the Mirror

- **State the rule, then the reason.** A rule without a reason gets deleted by the next
  person who finds it inconvenient.
- **Show the wrong way and the right way.** `// ❌` then `// ✅` — this repo's existing
  rules already use that shape; match it.
- **Name the file that proves it.** "See `activation-item-card.tsx` for the reference
  implementation" turns a rule into something checkable.
- **Put it in the matching section.** Both rule files share the same section order. A rule
  filed under the wrong heading is a rule nobody finds.
- **Add it to the "What NOT to Do" list** when it is a prohibition. Both files end with
  that list and agents read it as a checklist.

## Deleting a Rule

Deletions fan out exactly like additions. A rule removed from `AGENTS.md` but left in
`.github/copilot-instructions.md` is worse than never deleting it — now the two files
disagree and every agent picks a different winner. Grep for the rule's distinctive phrase
before declaring the deletion done.

## Red Flags

- Editing `AGENTS.md` and ending the turn without opening `.github/copilot-instructions.md`
- "I'll sync the other files in a separate commit"
- Copying a whole skill's body into `AGENTS.md` instead of linking to its path
- Adding an MCP server to `.mcp.json` only — VS Code users get nothing
- A rule that exists in the mirror but not in the canonical file (reverse drift)
- Summarising a rule down to a heading in the mirror, losing the actual constraint

## Verification Checklist

- [ ] The routing table was consulted and every named file was opened
- [ ] `AGENTS.md` and `.github/copilot-instructions.md` state the same rule, not two versions of it
- [ ] New skills are listed in the skills table of all three rule files
- [ ] New MCP servers exist in both `.mcp.json` and `.vscode/mcp.json`
- [ ] A grep for the new wording hits every target file
- [ ] The final message lists every file touched
