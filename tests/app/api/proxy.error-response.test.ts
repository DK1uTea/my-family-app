import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/[...path]/route';

describe('generic proxy network errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns a frontend translation key after the upstream fetch fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network unavailable'));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET(
      new NextRequest('http://localhost/api/user/me'),
      { params: Promise.resolve({ path: ['user', 'me'] }) },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      status: 502, message: 'BACKEND_UNREACHABLE', error_code: 'BACKEND_UNREACHABLE',
    });
  });
});
