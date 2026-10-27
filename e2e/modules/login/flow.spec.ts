import { expect, test } from '@playwright/test';

import { PRIMARY_EMAIL, PRIMARY_PASSWORD } from './login.data';
import { LoginPage } from './login.page';

/**
 * Login — the happy path, against the real backend.
 *
 * `SKIP_CAPTCHA_VERIFICATION=true` in `.env.local` is what makes this reliable: the
 * frontend still executes reCAPTCHA v3 and sends a token, but the backend skips the score
 * check, which otherwise scores a headless/automated browser too low and rejects it —
 * see `src/lib/verify-captcha.ts`.
 */

test.describe('login flow', () => {
  test('renders every control an unauthenticated visitor needs', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();

    await expect(login.email).toBeVisible();
    await expect(login.password).toBeVisible();
    await expect(login.rememberMe).toBeVisible();
    await expect(login.rememberMe).not.toBeChecked();
    await expect(login.submit).toBeEnabled();
    await expect(login.forgotPasswordLink).toHaveAttribute('href', '/de/forgot-password');
  });

  test('toggles the password between hidden and visible', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.password.fill(PRIMARY_PASSWORD);

    await expect(login.password).toHaveAttribute('type', 'password');

    await login.passwordToggle.click();
    await expect(login.password).toHaveAttribute('type', 'text');

    await login.passwordToggle.click();
    await expect(login.password).toHaveAttribute('type', 'password');
  });

  test('sends the entered credentials with a captcha token and lands on the dashboard', async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto();

    const loginRequest = page.waitForRequest((request) =>
      request.url().includes('/api/auth/login'),
    );

    await login.fillCredentials(PRIMARY_EMAIL, PRIMARY_PASSWORD);
    await login.rememberMe.click();
    await expect(login.rememberMe).toBeChecked();
    await login.submit.click();

    const payload = (await loginRequest).postDataJSON();
    expect(payload).toMatchObject({
      email: PRIMARY_EMAIL,
      password: PRIMARY_PASSWORD,
      rememberMe: true,
    });
    expect(typeof payload.captchaToken).toBe('string');

    await page.waitForURL(/\/(de|en)\/dashboards/, { timeout: 30_000 });

    // The real handler sets the cookies `src/proxy.ts` gates private routes on.
    const cookieNames = (await page.context().cookies()).map((cookie) => cookie.name);
    expect(cookieNames).toContain('accessToken');
    expect(cookieNames).toContain('refreshToken');
  });

  test('honours a redirectTo query parameter instead of the default dashboard', async ({
    page,
  }) => {
    const login = new LoginPage(page);
    await login.goto('?redirectTo=/de/user-settings');

    await login.submitWith(PRIMARY_EMAIL, PRIMARY_PASSWORD);

    await page.waitForURL(/\/de\/user-settings/, { timeout: 30_000 });
  });
});
