import { expect, type Page } from '@playwright/test';

import { waitForImagesSettled } from './session';

/**
 * Starts collecting browser console errors and warnings.
 *
 * Call this **before** navigating — messages emitted during load are the ones that matter,
 * and a listener attached afterwards misses them.
 *
 * ```ts
 * const consoleWatch = watchConsole(page);
 * await resumeSessionAt(page, 'userSettings');
 * await expect(page.getByRole('tab').first()).toBeVisible();
 * await consoleWatch.assertClean();
 * ```
 */
/**
 * Messages produced by the dev server itself, never by the app in production.
 *
 * Keep this list at zero if you possibly can, and add to it only with evidence: run the
 * same test against a production build (`next build && next start`) and confirm the message
 * does not appear there. A message that shows up in production is a defect to fix, not
 * noise to filter.
 *
 * - **script tag**: `src/app/layout.tsx` puts the theme-init `<script>` in `<head>` so it
 *   runs before first paint and prevents a flash of the wrong theme. React logs this when
 *   Fast Refresh re-renders the root layout on the client. Verified absent across 20 runs
 *   against a production build.
 */
const DEV_ONLY_NOISE = [
  'Encountered a script tag while rendering React component',
];

export function watchConsole(page: Page) {
  const problems: string[] = [];

  page.on('console', (message) => {
    const type = message.type();
    if (type !== 'error' && type !== 'warning') return;

    const text = message.text();
    if (DEV_ONLY_NOISE.some((noise) => text.includes(noise))) return;

    problems.push(`${type}: ${text}`);
  });

  return {
    problems,

    /**
     * Waits for the page to stop producing late messages, then asserts nothing was logged.
     *
     * The wait is not optional: Next.js checks an image's rendered geometry inside its
     * `onload`, so an aspect-ratio warning lands after the page is already interactive.
     * Asserting without it makes the test pass or fail on timing.
     */
    async assertClean() {
      await waitForImagesSettled(page);
      expect(problems, 'browser console must be free of errors and warnings').toEqual([]);
    },
  };
}
