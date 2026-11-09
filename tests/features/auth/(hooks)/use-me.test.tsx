import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NextIntlClientProvider } from 'next-intl';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMe } from '@/features/auth/(hooks)/use-me';
import { apiProxy } from '@/lib/api';
import viMessages from '@/messages/vi.json';
import { useUserStore } from '@/shared/stores/use-user-store';

vi.mock('@/lib/api', () => ({
  apiProxy: { get: vi.fn() },
  clientLogout: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ setTheme: vi.fn() }),
}));

describe('useMe', () => {
  beforeEach(() => {
    vi.mocked(apiProxy.get).mockReset();
    useUserStore.setState({ navbar: null });
  });

  it('uses VND when the current user has no saved currency preference', async () => {
    vi.mocked(apiProxy.get).mockResolvedValue({
      data: {
        data: {
          id: 'user-1',
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: { navbar: [] },
          settings: {
            preferredLanguage: 'vi',
            appearance: 'light',
            dateFormat: 'DD/MM/YYYY',
          },
        },
      },
    } as never);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NextIntlClientProvider locale="vi" messages={viMessages}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </NextIntlClientProvider>
    );

    renderHook(() => useMe(), { wrapper });

    expect(apiProxy.get).toHaveBeenCalledWith('/users/me');

    await waitFor(() => {
      expect(useUserStore.getState().preferences.currency).toEqual({
        code: 'VND',
        symbol: '₫',
      });
    });

    queryClient.clear();
  });
});
