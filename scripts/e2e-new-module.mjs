#!/usr/bin/env node
/**
 * Scaffolds an E2E module folder.
 *
 *   pnpm e2e:new <module-name>            authenticated module (default)
 *   pnpm e2e:new <module-name> --public    page reachable without signing in
 *
 * The module name must match the route segment so `pnpm test:e2e <module-name>` filters to
 * it — that is the whole point of the folder-per-module layout.
 *
 * Writes placeholder specs that FAIL on purpose. They are the RED step: fill them in from
 * what you observed in the browser, never from what you assume the page does.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [rawName, ...flags] = process.argv.slice(2);
const isPublic = flags.includes('--public');

if (!rawName) {
  console.error('Usage: pnpm e2e:new <module-name> [--public]');
  process.exit(1);
}

const name = rawName.trim().toLowerCase();

if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(`Invalid module name "${rawName}". Use kebab-case, e.g. customer-activation.`);
  process.exit(1);
}

const dir = join('e2e', 'modules', name);

if (existsSync(dir)) {
  console.error(`${dir} already exists — edit it instead of scaffolding over it.`);
  process.exit(1);
}

/** camelCase key used in the MODULES map in e2e/shared/session.ts. */
const moduleKey = name.replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());

const dataFile = `/**
 * ${name} — visible copy, read off the rendered page (Vietnamese, the default locale).
 * Keeping it here means a copy change touches one file, not every spec.
 *
 * TODO: replace these with strings you actually saw in the browser.
 */
export const COPY = {
  heading: 'TODO: the module heading as rendered',
} as const;
`;

const authedFlow = `import { expect, test } from '@playwright/test';

import { MODULES, openModule, sidebarLink, signIn } from '../../shared/session';
import { COPY } from './${name}.data';

/**
 * ${name} — reaching the module.
 *
 * Walks the whole journey: sign in, get redirected, click the sidebar entry. That covers
 * the middleware guard, the locale rewrite and the app shell.
 *
 * BEFORE FILLING THIS IN: add \`${moduleKey}\` to MODULES in e2e/shared/session.ts, then open
 * the page with the Playwright MCP browser and read its accessibility tree. Assert what you
 * saw — see .claude/skills/e2e-module-testing/SKILL.md.
 */

test.describe('${name} journey', () => {
  test('signs in, lands on the dashboard, then opens the module from the sidebar', async ({
    page,
  }) => {
    await signIn(page);

    await expect(page).toHaveURL(/\\/vi\\/dashboards/);
    await expect(sidebarLink(page, '${moduleKey}')).toBeVisible();

    await openModule(page, '${moduleKey}');

    await expect(page).toHaveURL(new RegExp(MODULES.${moduleKey}.href.replace(/\\//g, '\\\\/')));
    await expect(page.getByRole('heading', { name: COPY.heading })).toBeVisible();
  });

  test('sends an unauthenticated visitor to login instead', async ({ page }) => {
    await page.goto(MODULES.${moduleKey}.href);

    await expect(page).toHaveURL(/\\/vi\\/login/);
  });
});
`;

const publicFlow = `import { expect, test } from '@playwright/test';

import { COPY } from './${name}.data';

/**
 * ${name} — main flow (no sign-in required).
 *
 * BEFORE FILLING THIS IN: open the page with the Playwright MCP browser and read its
 * accessibility tree. Assert what you saw — see
 * .claude/skills/e2e-module-testing/SKILL.md.
 */

const ROUTE = '/vi/${name}';

test.describe('${name} flow', () => {
  test('renders its heading', async ({ page }) => {
    await page.goto(ROUTE);

    await expect(page.getByRole('heading', { name: COPY.heading })).toBeVisible();
  });
});
`;

const authedContent = `import { expect, test } from '@playwright/test';

import { watchConsole } from '../../shared/console';
import { resumeSessionAt } from '../../shared/session';
import { COPY } from './${name}.data';

/**
 * ${name} — page content.
 *
 * \`resumeSessionAt\` signs in via a direct API call instead of the UI: the journey is
 * covered in flow.spec.ts, and a full UI sign-in per assertion costs a real login round
 * trip each time instead of one API call.
 *
 * Everything here hits the real backend — there is no mocked mode. If this page needs a
 * specific data state (an empty list, a particular record), get a real account or fixture
 * data into that state first; see .claude/skills/e2e-module-testing/SKILL.md.
 */

test.describe('${name} content', () => {
  test('TODO: assert the behaviour from the module spec', async ({ page }) => {
    await resumeSessionAt(page, '${moduleKey}');

    await expect(page.getByRole('heading', { name: COPY.heading })).toBeVisible();
  });

  test('keeps the browser console clean', async ({ page }) => {
    const consoleWatch = watchConsole(page);

    await resumeSessionAt(page, '${moduleKey}');
    await expect(page.getByRole('heading', { name: COPY.heading })).toBeVisible();

    await consoleWatch.assertClean();
  });
});
`;

const a11ySpec = `import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

${isPublic ? '' : `import { resumeSessionAt } from '../../shared/session';\n`}import { COPY } from './${name}.data';

/**
 * ${name} — accessibility.
 *
 * Scan twice: clean, and with any error/empty state on screen. Error states are where
 * contrast and label-association regressions actually appear.
 */

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

test.describe('${name} accessibility', () => {
  test('has no automatically detectable WCAG 2.1 AA violations', async ({ page }) => {
${
  isPublic
    ? `    await page.goto('/vi/${name}');`
    : `    await resumeSessionAt(page, '${moduleKey}');`
}
    await expect(page.getByRole('heading', { name: COPY.heading })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(WCAG)
      // Third-party widget we cannot fix.
      .exclude('.grecaptcha-badge')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, `${name}.data.ts`), dataFile);
writeFileSync(join(dir, 'flow.spec.ts'), isPublic ? publicFlow : authedFlow);
if (!isPublic) writeFileSync(join(dir, 'content.spec.ts'), authedContent);
writeFileSync(join(dir, 'a11y.spec.ts'), a11ySpec);

console.log(`Scaffolded ${dir}/`);
console.log(`  ${name}.data.ts   visible copy`);
console.log(`  flow.spec.ts${' '.repeat(Math.max(0, name.length - 6))}   ${isPublic ? 'main flow' : 'sign in -> sidebar -> module'}`);
if (!isPublic) console.log(`  content.spec.ts  page content + console health`);
console.log(`  a11y.spec.ts     axe scan`);
console.log('');

if (!isPublic) {
  console.log(`Next: add "${moduleKey}" to MODULES in e2e/shared/session.ts, with its`);
  console.log('      href and the Vietnamese sidebar label users click.');
}

console.log('Then: open the page with the Playwright MCP browser, read the accessibility');
console.log('      tree, and replace every TODO with something you actually saw.');
console.log('');
console.log(`Run it with:  pnpm test:e2e ${name}`);
console.log(`Watch it in:  pnpm test:e2e:ui ${name}`);
