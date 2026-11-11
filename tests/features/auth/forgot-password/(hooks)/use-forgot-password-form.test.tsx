import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/vi.json';

const { replace, error } = vi.hoisted(() => ({ replace: vi.fn(), error: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('sonner', () => ({ toast: { error, success: vi.fn() } }));

import { useForgotPasswordForm } from '@/features/auth/forgot-password/(hooks)/use-forgot-password-form';

describe('forgot password API errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/vi/forgot-password');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('displays localized copy for an error key from the fetch response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ status: 502, message: 'UPSTREAM_REQUEST_FAILED', error_code: 'UPSTREAM_REQUEST_FAILED' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useForgotPasswordForm());

    act(() => { result.current.form.setValue('email', 'adult@example.test'); });
    await act(async () => { await result.current.onSubmit(); });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(messages.errors.UPSTREAM_REQUEST_FAILED);
    expect(replace).not.toHaveBeenCalled();
  });
});
