import type { Locator, Page } from '@playwright/test';

/**
 * Page object for `/[locale]/login`.
 *
 * Every locator here was read off the live accessibility tree, not guessed. They are all
 * role + accessible name, which is only possible because `login-form.tsx` labels its
 * controls properly — see `e2e/modules/login/a11y.spec.ts` for the tests that keep it that way.
 */

/** Visible copy, from `login.*` in `src/messages/vi.json`. */
export const LOGIN_COPY = {
  emailLabel: 'Email',
  passwordLabel: 'Mật khẩu',
  emailPlaceholder: 'user@example.com',
  passwordPlaceholder: 'Tối thiểu 6 ký tự',
  rememberMe: 'Duy trì đăng nhập',
  forgotPassword: 'Quên mật khẩu?',
  showPassword: 'Hiện mật khẩu',
  hidePassword: 'Ẩn mật khẩu',
  submit: 'Đăng nhập',
} as const;

/** Error copy the form can render, from `vi.json`. */
export const LOGIN_ERRORS = {
  /** `fieldErrors.email` — note this fires for an empty email too, not `login.validation.emailRequired`. */
  emailInvalid: 'Vui lòng nhập địa chỉ email hợp lệ',
  /** `login.validation.passwordRequired` */
  passwordRequired: 'Mật khẩu là bắt buộc',
  /** `login.validation.passwordMin` */
  passwordMin: 'Mật khẩu phải có ít nhất 6 ký tự',
  /** `login.attemptsRemaining`, ICU plural */
  attemptsRemaining: (count: number) =>
    count === 1
      ? 'Email hoặc mật khẩu không chính xác. Bạn còn 1 lần thử.'
      : `Email hoặc mật khẩu không chính xác. Bạn còn ${count} lần thử.`,
  /** `login.accountLockedWithDuration`, ICU plural */
  accountLocked: (minutes: number) =>
    minutes === 1
      ? 'Tài khoản của bạn tạm thời bị khóa. Vui lòng thử lại sau 1 phút.'
      : `Tài khoản của bạn tạm thời bị khóa. Vui lòng thử lại sau ${minutes} phút.`,
  /** `login.captchaNotReady` */
  captchaNotReady:
    'Vui lòng đợi trong khi xác minh bảo mật đang tải, sau đó thử lại.',
} as const;

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly passwordToggle: Locator;
  readonly rememberMe: Locator;
  readonly forgotPasswordLink: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;

    // Both fields carry a real <label htmlFor>; the required asterisk inside it is
    // aria-hidden, so the accessible names are exactly "E-Mail" and "Passwort".
    //
    // getByRole, not getByLabel: getByLabel matches the label's raw textContent
    // ("E-Mail*", asterisk included) and ignores aria-hidden, so an exact match there
    // finds nothing. getByRole runs the real accessible-name computation. `exact` also
    // keeps "Passwort" from resolving the toggle button ("Passwort anzeigen").
    this.email = page.getByRole('textbox', { name: LOGIN_COPY.emailLabel, exact: true });
    this.password = page.getByRole('textbox', { name: LOGIN_COPY.passwordLabel, exact: true });

    // The toggle's accessible name flips with its state, so match either.
    this.passwordToggle = page.getByRole('button', {
      name: new RegExp(`${LOGIN_COPY.showPassword}|${LOGIN_COPY.hidePassword}`),
    });

    this.rememberMe = page.getByRole('checkbox', { name: LOGIN_COPY.rememberMe });
    this.forgotPasswordLink = page.getByRole('link', { name: LOGIN_COPY.forgotPassword });
    this.submit = page.getByRole('button', { name: LOGIN_COPY.submit });
  }

  async goto(search = '') {
    await this.page.goto(`/vi/login${search}`);
  }

  async fillCredentials(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
  }

  async submitWith(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submit.click();
  }

  /** The inline server/validation error rendered directly under the password field. */
  passwordError(text: string) {
    return this.page.getByText(text, { exact: true });
  }

  /** Sonner renders toasts into a live region; text match is enough to assert one. */
  toast(text: string) {
    return this.page.getByText(text, { exact: true });
  }
}

/**
 * Tracks whether the real login endpoint was ever called during this test — the
 * assertion client-side validation makes: a bad form never reaches the backend at all.
 * Attach before navigating, or an early request can be missed.
 */
export function watchLoginRequests(page: Page) {
  let called = false;
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/login')) called = true;
  });
  return () => called;
}
