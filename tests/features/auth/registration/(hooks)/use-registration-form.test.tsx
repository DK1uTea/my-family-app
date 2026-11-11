import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/vi.json';

const { replace, error } = vi.hoisted(() => ({ replace: vi.fn(), error: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('sonner', () => ({ toast: { error, success: vi.fn() } }));

import { useRegistrationForm } from '@/features/auth/registration/(hooks)/use-registration-form';

describe('registration API errors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/vi/registration');
  });
  afterEach(() => vi.unstubAllGlobals());

  it('displays localized copy for an invite error key', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ status: 422, message: 'INVITATION_EXPIRED', error_code: 'INVITATION_EXPIRED' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useRegistrationForm({ email: 'adult@example.test', code: 'invite-code' }));

    act(() => {
      result.current.form.setValue('firstName', 'Adult');
      result.current.form.setValue('lastName', 'User');
      result.current.form.setValue('password', 'Password1!');
      result.current.form.setValue('repeatPassword', 'Password1!');
    });
    await act(async () => { await result.current.onSubmit(); });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(error).toHaveBeenCalledWith(messages.errors.INVITATION_EXPIRED);
    expect(replace).not.toHaveBeenCalled();
  });
});
