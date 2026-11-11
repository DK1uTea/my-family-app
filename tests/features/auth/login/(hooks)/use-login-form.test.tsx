import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/vi.json';

const { post, replace, warning } = vi.hoisted(() => ({
  post: vi.fn(), replace: vi.fn(), warning: vi.fn(),
}));

vi.mock('@/lib/api', () => ({ apiProxy: { post } }));
vi.mock('@/lib/verify-captcha', () => ({ CAPTCHA_BYPASS_ENABLED: true }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('react-google-recaptcha-v3', () => ({ useGoogleReCaptcha: () => ({ executeRecaptcha: undefined }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), warning } }));

import { useLoginForm } from '@/features/auth/login/(hooks)/use-login-form';

describe('login status 203 warning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/vi/login');
  });

  it('translates the backend warning key before displaying it', async () => {
    post.mockResolvedValue({ status: 203, data: { message: 'AUTH_PASSWORD_CHANGE_REQUIRED' } });
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.form.setValue('email', 'adult@example.test');
      result.current.form.setValue('password', '123456789abc');
    });
    await act(async () => { await result.current.onSubmit(); });

    await waitFor(() => expect(warning).toHaveBeenCalledWith(messages.errors.AUTH_PASSWORD_CHANGE_REQUIRED));
    expect(replace).toHaveBeenCalledWith('/dashboards');
  });
});
