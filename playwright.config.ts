import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// `.env.local` first so it wins — that is where E2E_USER_EMAIL / E2E_USER_PASSWORD /
// SKIP_CAPTCHA_VERIFICATION live. Both files are gitignored; `.env.example` documents
// every variable name.
dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ path: '.env', quiet: true });

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';

/**
 * E2E tests only — `e2e/**\/*.spec.ts`.
 * Unit/component tests live in `tests/**\/*.test.ts(x)` and run under Vitest.
 *
 * The app is locale-prefixed (default `de`), so every path in a test must be
 * written with its prefix: `/de/login`, `/en/dashboards`.
 *
 * Every spec hits the real backend — there is no mocked project. Sign-ins rely on
 * `SKIP_CAPTCHA_VERIFICATION=true` (see `src/lib/verify-captcha.ts`) so a headless
 * browser's low reCAPTCHA v3 score never gets a real login rejected.
 *
 * **This suite is local-only, by decision — there is no CI job for it, and this config
 * carries no CI branches.** Two independent reasons, either one sufficient:
 *   1. The captcha bypass above is double-gated on `NODE_ENV !== 'production'`, so it only
 *      works against `pnpm dev`. A CI job building the app would have every sign-in
 *      rejected (see the `webServer` note below).
 *   2. Specs create, mutate and delete real Events through one shared real account. Two
 *      runs at once fight over that account and leave real rows behind.
 * Run it yourself before pushing: `pnpm test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  // No retries: a green-on-retry run against a real backend hides the flake instead of
  // reporting it, and there is no CI here to keep unblocked.
  retries: 0,
  // Every worker shares one dev server and one real backend account, so this is a
  // reliability setting, not a speed dial. Left at Playwright's default (half the CPU
  // cores — 8 on a 16-core machine) the wizard's shell renders while its data-dependent
  // body does not, and specs fail on controls that exist but never become enabled.
  // Measured 2026-07-30 on the events suite: 8 workers → 5 failed in 1.8min;
  // 2 workers → 0 failed in 2.7min; 1 worker → 0 failed in 4.4min.
  workers: 2,
  reporter: [['html', { open: 'never' }], ['list']],
  // `next dev` compiles each route on first request, which can take several seconds.
  // 5s (the Playwright default) is not enough for a route's first navigation. See the
  // `webServer` note below for why a prebuilt server is not an option here.
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    // `on-first-retry` would never fire now that `retries` is 0 — keep the trace of the
    // run that actually failed, since there is no second attempt to capture one.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'de-DE',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `pnpm dev`, never `pnpm build && pnpm start` — load-bearing, not a leftover. The
    // login bypass in `src/lib/verify-captcha.ts` is double-gated on
    // `NODE_ENV !== 'production'` *and* `SKIP_CAPTCHA_VERIFICATION=true`, deliberately so
    // that no runtime env var can switch it on in a real deployment. `pnpm start` builds
    // with `NODE_ENV=production`, which closes that gate, and every sign-in then fails with
    // `400 {"message":["Captcha verification failed"]}` because reCAPTCHA v3 scores
    // headless traffic below 0.5. Verified 2026-07-30: switching this to a production build
    // took the events suite from 40 passing to 4. Do not "optimise" the build back in.
    //
    // The cost is `next dev`'s per-route compile on first request. That is what
    // `expect.timeout: 10_000` absorbs, and why `workers` is capped above rather than left
    // at Playwright's default — parallel workers all paying that cost at once is what
    // starved data-dependent UI.
    command: 'pnpm dev',
    url: BASE_URL,
    // An already-running `pnpm dev` on this port is reused, so the suite starts instantly
    // while you have the app open. Nothing else may occupy :3000 during a run.
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
