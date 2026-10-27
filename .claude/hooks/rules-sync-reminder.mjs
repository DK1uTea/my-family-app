#!/usr/bin/env node
/**
 * PostToolUse hook — agent rules sync reminder.
 *
 * The team uses different AI agents (Claude Code, Copilot, Cursor, Codex). A rule that
 * only lands in one rule file is a rule the other agents will violate. This hook fires
 * when an agent-facing file is edited and injects a reminder naming the exact mirrors
 * that must be updated in the same change.
 *
 * Protocol: .claude/skills/agent-rules-sync/SKILL.md
 *
 * Reads the PostToolUse payload on stdin, writes hook JSON on stdout. Never fails the
 * tool call — any error exits 0 silently.
 */

import { basename } from 'node:path';

/** Each rule: does this path match, and which mirrors does it require? */
const RULES = [
  {
    match: (p) => p === 'CLAUDE.md',
    mirrors: () => [
      '`.github/copilot-instructions.md` — full mirror, must not omit or contradict the rule',
      '`AGENTS.md` — only if this is a workflow-level or hard-constraint rule',
    ],
  },
  {
    match: (p) => p === '.github/copilot-instructions.md',
    mirrors: () => [
      '`CLAUDE.md` — the canonical file; it must state the same rule',
      '`AGENTS.md` — only if this is a workflow-level or hard-constraint rule',
    ],
  },
  {
    match: (p) => p === 'AGENTS.md',
    mirrors: () => [
      '`CLAUDE.md` — the canonical file',
      '`.github/copilot-instructions.md` — full mirror',
    ],
  },
  {
    match: (p) => p.startsWith('.claude/skills/') && p.endsWith('SKILL.md'),
    mirrors: (p) => {
      const name = p.split('/')[2];
      return [
        `the skills table in \`CLAUDE.md\`, \`.github/copilot-instructions.md\` and \`AGENTS.md\` — only if \`${name}\` is new or changed purpose`,
        'skills are referenced by path, never copied — do not paste the body into a rule file',
      ];
    },
  },
  {
    match: (p) => p.startsWith('.omc/skills/') && p.endsWith('SKILL.md'),
    mirrors: (p) => {
      const name = p.split('/')[2];
      return [`\`.claude/commands/${name}.md\` — the condensed slash-command mirror of this skill`];
    },
  },
  {
    match: (p) => p.startsWith('.claude/commands/') && p.endsWith('.md'),
    mirrors: (p) => {
      const name = basename(p, '.md');
      return [`\`.omc/skills/${name}/SKILL.md\` — the full skill this command mirrors`];
    },
  },
  {
    match: (p) => p === '.mcp.json',
    mirrors: () => [
      '`.vscode/mcp.json` — same servers, VS Code schema (`servers` + `type: "stdio"`)',
      'the MCP section of `CLAUDE.md`, `.github/copilot-instructions.md` and `AGENTS.md`',
    ],
  },
  {
    match: (p) => p === '.vscode/mcp.json',
    mirrors: () => [
      '`.mcp.json` — same servers, Claude Code schema (`mcpServers`)',
      'the MCP section of `CLAUDE.md`, `.github/copilot-instructions.md` and `AGENTS.md`',
    ],
  },
  {
    match: (p) => p === 'package.json',
    mirrors: () => [
      'the Commands section of `CLAUDE.md`, `.github/copilot-instructions.md` and `AGENTS.md` — **only if you added or renamed a script an agent should run**',
    ],
  },
];

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}

/** Absolute or relative, Windows or POSIX → repo-relative POSIX path. */
function toRepoRelative(filePath) {
  const cwd = process.cwd().replace(/\\/g, '/').replace(/\/$/, '');
  let p = filePath.replace(/\\/g, '/');

  if (p.toLowerCase().startsWith(cwd.toLowerCase())) {
    p = p.slice(cwd.length);
  }

  return p.replace(/^\.?\//, '');
}

const raw = await readStdin();

let payload;
try {
  payload = JSON.parse(raw);
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path ?? payload?.tool_response?.filePath;
if (typeof filePath !== 'string' || filePath.length === 0) process.exit(0);

const relative = toRepoRelative(filePath);
const rule = RULES.find((r) => r.match(relative));
if (!rule) process.exit(0);

const mirrors = rule.mirrors(relative);

const context = [
  `[agent-rules-sync] You just edited \`${relative}\`, which is an agent-facing file.`,
  '',
  'Before ending this turn, update its mirrors **in this same change** — not in a follow-up commit:',
  ...mirrors.map((m) => `  - ${m}`),
  '',
  'Then verify and report:',
  '  1. Grep a distinctive phrase from the change across `CLAUDE.md`, `.github/copilot-instructions.md` and `AGENTS.md`.',
  '  2. List every file you touched in your final message.',
  '',
  'Full protocol: `.claude/skills/agent-rules-sync/SKILL.md`.',
  'If this edit carried no rule change (typo, formatting, wording with the same meaning), no mirror is needed — say so and move on.',
].join('\n');

process.stdout.write(
  JSON.stringify({
    suppressOutput: true,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: context,
    },
  }),
);
