import { expect, test } from '@playwright/test';

import { PRIMARY_EMAIL, PRIMARY_PASSWORD } from './login.data';
import { DE_ERRORS, LoginPage, watchLoginRequests } from './login.page';

/**
 * Login — client-side validation.
 *
 * No backend involved by design: the point of client validation is that a bad form
 * never reaches the login endpoint, so every test here also asserts zero requests.
 */

test.describe('login validation', () => {
  test('blocks submission and reports both fields when the form is empty', async ({ page }) => {
    const login = new LoginPage(page);
    const wasLoginCalled = watchLoginRequests(page);
    await login.goto();

    await login.submit.click();

    await expect(login.passwordError(DE_ERRORS.emailInvalid)).toBeVisible();
    await expect(login.passwordError(DE_ERRORS.passwordRequired)).toBeVisible();
    await expect(login.email).toHaveAttribute('aria-invalid', 'true');
    await expect(login.password).toHaveAttribute('aria-invalid', 'true');
    expect(wasLoginCalled()).toBe(false);
  });

  test('rejects a malformed email address', async ({ page }) => {
    const login = new LoginPage(page);
    const wasLoginCalled = watchLoginRequests(page);
    await login.goto();

    await login.submitWith('not-an-email', PRIMARY_PASSWORD);

    await expect(login.passwordError(DE_ERRORS.emailInvalid)).toBeVisible();
    expect(wasLoginCalled()).toBe(false);
  });

  test('rejects a password shorter than six characters', async ({ page }) => {
    const login = new LoginPage(page);
    const wasLoginCalled = watchLoginRequests(page);
    await login.goto();

    await login.submitWith(PRIMARY_EMAIL, 'short');

    await expect(login.passwordError(DE_ERRORS.passwordMin)).toBeVisible();
    expect(wasLoginCalled()).toBe(false);
  });
});
