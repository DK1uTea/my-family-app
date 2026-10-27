import nextConfig from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const baseImportPaths = [
  {
    name: 'next/link',
    message: "Import Link from '@/i18n/navigation' instead.",
  },
  {
    name: 'next/navigation',
    importNames: ['useRouter', 'usePathname', 'Link'],
    message: "Import from '@/i18n/navigation' instead.",
  },
];

const eslintConfig = [
  {
    ignores: [
      '.claude/worktrees/**',
      // Generated artifacts — Playwright's HTML report bundles vendor JS that trips
      // dozens of rules and would otherwise break `pnpm lint` after every E2E run.
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
      '.playwright-mcp/**',
      'coverage/**',
      'old/**',
    ],
  },
  ...nextConfig,

  // ---------------------------------------------------------------------------
  // Accessibility
  //
  // `eslint-config-next/typescript` ships NO jsx-a11y rules, so before this block
  // nothing caught an unlabelled input or an icon button with no accessible name.
  //
  // Turning the whole recommended set to `error` today would fail on ~78 pre-existing
  // violations across 39 files and block every commit. So this is a ratchet:
  //   - everything from recommended runs at `warn` — the debt is visible, not fatal
  //   - rules that are already at ZERO violations run at `error` — they can never regress
  //   - `src/features/auth/**` runs everything at `error` — it is clean and stays clean
  // When a warn-level rule reaches zero, promote it into the ERROR list below.
  // Narrative rules (focus order, contrast, announcements) live in
  // `.claude/skills/accessibility/SKILL.md` and are enforced by
  // `e2e/modules/<module>/a11y.spec.ts`.
  //
  // Scoped to `src/` only. Component tests under `tests/` render JSX deliberately —
  // sometimes an unlabelled control, to assert the fallback — so a11y lint there would
  // be noise. Test JSX is checked by the axe scans instead.
  // ---------------------------------------------------------------------------
  {
    files: ['src/**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      // Baseline: visible but non-blocking.
      ...Object.fromEntries(
        Object.keys(jsxA11y.flatConfigs.recommended.rules).map((rule) => [rule, 'warn']),
      ),

      // ERROR — currently at zero violations, so these are locked in.
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either', depth: 3 }],
      'jsx-a11y/alt-text': ['error', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
      'jsx-a11y/html-has-lang': 'error',
    },
  },

  // The auth pages are fully a11y-clean and covered by
  // e2e/modules/login/a11y.spec.ts. Everything is fatal here so a regression cannot ship.
  {
    files: ['src/features/auth/**/*.tsx', 'src/app/[locale]/(auth)/**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: jsxA11y.flatConfigs.recommended.rules,
  },

  // Rules for source and both test suites. `tests/` and `e2e/` are included on
  // purpose: a test that imports dayjs or next/navigation directly asserts against
  // the wrong thing, so the same import bans have to reach them.
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-restricted-imports': ['error', { paths: baseImportPaths }],
    },
  },

  // Same rules + dayjs restriction everywhere except date-utils.ts, the one file
  // allowed to import dayjs directly.
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    ignores: ['src/lib/date-utils.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            ...baseImportPaths,
            {
              name: 'dayjs',
              message: "Import { dayjs } from '@/lib/date-utils' instead. Never import dayjs directly.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
