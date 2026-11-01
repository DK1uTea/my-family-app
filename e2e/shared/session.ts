import type { Page } from '@playwright/test';

import { LoginPage } from '../modules/login/login.page';

/**
 * Authenticated-flow harness — hits the real backend, always. There is no mocked mode.
 *
 * This only works because `SKIP_CAPTCHA_VERIFICATION=true` is set in `.env.local` (see
 * `src/lib/verify-captcha.ts`): the frontend still executes reCAPTCHA and sends a token,
 * but the backend's score check is skipped, so real logins are not flaky against a
 * headless browser's low bot-likelihood score.
 *
 * A module test starts the way a user does: sign in, get redirected, click into the
 * module from the sidebar. Nothing is short-circuited, so the test covers the guard
 * chain (`src/proxy.ts`), the locale rewrite and the shell — not just the module page.
 */

/** Sidebar entries, read off the rendered page — canonical href and default labels. */
export const MODULES = {
  dashboards: { href: '/vi/dashboards', label: 'Dashboards' },
  calendarDashboard: { href: '/vi/calendar-dashboard', label: 'Calendar Navigator' },
  events: { href: '/vi/events', label: 'Event Navigator' },
  rent: { href: '/vi/rent', label: 'Catalogue' },
  customerActivation: { href: '/vi/customer-activation', label: 'Customer Activation' },
  reportingTool: { href: '/vi/reporting-tool', label: 'Event Reporting Tool' },
  userSettings: { href: '/vi/user-settings', label: 'User Settings' },
} as const;

export type ModuleName = keyof typeof MODULES;

/**
 * Required — every test in this suite that signs in uses this account.
 *
 * The account's stored `preferredLanguage` may be Vietnamese or English. Tests that assert
 * module UI copy must derive the locale from the authenticated page rather than assuming
 * a language or trying to override the account preference with a cookie.
 */
export function primaryCredentials() {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('Set E2E_USER_EMAIL and E2E_USER_PASSWORD in .env.local (see .env.example).');
  }

  return { email, password };
}

/**
 * Optional accounts for backend states a fresh login cannot produce on demand — a locked
 * account, an inactive account, one restricted to specific sidebar modules. Each returns
 * `null` when its env vars are incomplete, so the calling spec can `test.skip(...)`
 * rather than fail on a fixture that was never provisioned.
 */
export function lockedCredentials() {
  const email = process.env.E2E_LOCKED_USER_EMAIL;
  const password = process.env.E2E_LOCKED_USER_PASSWORD;
  return email && password ? { email, password } : null;
}

export function inactiveCredentials() {
  const email = process.env.E2E_INACTIVE_USER_EMAIL;
  const password = process.env.E2E_INACTIVE_USER_PASSWORD;
  return email && password ? { email, password } : null;
}

/**
 * A wildcard-admin ("White Card") account — needed to test Export Excel /
 * Transfer Event visibility on calendar-dashboard, both gated on the `*`
 * permission per `src/features/calendar/CONTEXT.md`. Follows the same
 * optional/null pattern as `lockedCredentials`/`restrictedCredentials`: no
 * env vars configured means the calling spec should `test.skip(...)`.
 */
export function wildcardAdminCredentials() {
  const email = process.env.E2E_WILDCARD_ADMIN_EMAIL;
  const password = process.env.E2E_WILDCARD_ADMIN_PASSWORD;
  return email && password ? { email, password } : null;
}

export function restrictedCredentials() {
  const email = process.env.E2E_RESTRICTED_USER_EMAIL;
  const password = process.env.E2E_RESTRICTED_USER_PASSWORD;
  const modules = process.env.E2E_RESTRICTED_USER_MODULES;

  if (!email || !password || !modules) return null;

  const visibleModules = modules.split(',').map((m) => m.trim()) as ModuleName[];
  return { email, password, visibleModules };
}

/**
 * Signs in through the login form and waits for the redirect to the dashboard — the real
 * UI journey, for specs that are testing the journey itself.
 *
 * The account's real, stored language preference is the source of truth. The redirect may
 * land on either `/vi/dashboards` or `/en/dashboards`, so callers must match both or derive
 * copy and routes from the resulting page URL.
 */
export async function signIn(page: Page, credentials = primaryCredentials()) {
  const login = new LoginPage(page);
  await login.goto();
  await login.submitWith(credentials.email, credentials.password);
  await page.waitForURL(/\/(?:vi|en)\/dashboards/, { timeout: 30_000 });
}

/**
 * Signs in via a direct API call instead of the UI.
 *
 * `page.request` shares its cookie jar with `page.context()`, so the real `Set-Cookie`
 * headers from `/api/auth/login` land in the browser context exactly as they would from a
 * form submission — `page.goto()` afterwards is already authenticated. This is still the
 * real endpoint and a real session; it just skips rendering the login page first.
 *
 * Needs `SKIP_CAPTCHA_VERIFICATION=true`, since no browser-executed reCAPTCHA token exists
 * to send here.
 */
export async function authenticateViaApi(
  page: Page,
  credentials: { email: string; password: string } = primaryCredentials(),
) {
  const response = await page.request.post('/api/auth/login', {
    data: { ...credentials, captchaToken: '' },
  });
  const body = await response.json();

  if (!body?.data?.accessToken) {
    throw new Error(
      `authenticateViaApi failed for ${credentials.email}: ${JSON.stringify(body)}\n` +
        'Is SKIP_CAPTCHA_VERIFICATION=true set in .env.local?',
    );
  }
}

/**
 * Ends the current real session before another account is authenticated in the same page.
 * Clearing browser cookies alone is not enough: the app can still hold the previous
 * account's query/store state, and the backend refresh cookie is server-managed.
 */
export async function logoutSession(page: Page) {
  const cookies = await page.context().cookies();
  const accessToken = cookies.find((cookie) => cookie.name === "accessToken")?.value;
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;

  await page.request.post("/api/auth/logout", { headers }).catch(() => {});
  await page.request.put("/api/clear-cookies").catch(() => {});
  await page.context().clearCookies();

  // A full navigation drops the previous React Query/Zustand in-memory auth state too.
  await page.goto("/vi/login");
}

/**
 * Pins the UI language.
 *
 * The locale is driven by cookies, not by the URL: `src/proxy.ts` reads
 * `preferredLanguage` then `NEXT_LOCALE`, falls back to `vi`, and rewrites any path whose
 * prefix disagrees. Visiting `/en/login` without this cookie lands on `/vi/login`.
 *
 * Also sets `appearance` — not because this helper is about theme, but because
 * `src/proxy.ts` only trusts an already-set locale when `appearance` is present too:
 * `needsServerPreferences = isAuthenticated && (!preferredLanguage || !appearance)`. Miss
 * `appearance` and the middleware refetches `/user/me` on the very next authenticated
 * request and overwrites the locale with the account's real stored preference, silently
 * undoing this pin.
 */
export async function setLocaleCookie(page: Page, locale: 'vi' | 'en') {
  const url = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000';
  await page.context().addCookies([
    { name: 'preferredLanguage', value: locale, url },
    { name: 'NEXT_LOCALE', value: locale, url },
    { name: 'appearance', value: 'light', url },
  ]);
}

/**
 * Waits until every image has finished loading.
 *
 * Required before asserting the console is clean: Next.js checks an image's rendered
 * geometry in its `onload`, so an aspect-ratio warning arrives *after* the page is
 * otherwise interactive. Asserting earlier makes the test pass or fail on timing.
 */
export async function waitForImagesSettled(page: Page) {
  await page.waitForFunction(
    () => Array.from(document.images).every((image) => image.complete),
    undefined,
    { timeout: 15_000 },
  );
}

/**
 * A module's entry in the sidebar.
 *
 * Scoped to the sidebar on purpose: the breadcrumb renders the current page as
 * `<span role="link">DASHBOARDS</span>`, so an unscoped `getByRole('link', …)` is a
 * strict-mode violation on whichever module the user is currently looking at.
 */
export function sidebarLink(page: Page, name: ModuleName) {
  return page
    .locator('[data-slot="sidebar-menu-button"]')
    .filter({ hasText: MODULES[name].label })
    .first();
}

/** Clicks a module in the sidebar the way a user would, then waits for its route. */
export async function openModule(page: Page, name: ModuleName) {
  const { href } = MODULES[name];

  await sidebarLink(page, name).click();
  await page.waitForURL(new RegExp(href.replace(/\//g, '\\/')), { timeout: 30_000 });
}

/**
 * Skips the login form and drops straight into a module with a real, API-signed-in
 * session.
 *
 * Use only for specs where the journey is not the thing under test — a suite of twenty
 * module specs should not pay for twenty full UI sign-ins. Anything asserting the guard
 * chain or the redirect must use `signIn` instead.
 */
export async function resumeSessionAt(
  page: Page,
  name: ModuleName,
  credentials = primaryCredentials(),
) {
  await authenticateViaApi(page, credentials);
  await page.goto(MODULES[name].href);
}
