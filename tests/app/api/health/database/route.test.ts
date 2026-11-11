import { beforeEach, describe, expect, it, vi } from 'vitest';

const { checkDatabaseConnection } = vi.hoisted(() => ({ checkDatabaseConnection: vi.fn() }));
vi.mock('@/server/third-party/neon/database', () => ({ checkDatabaseConnection }));

import { GET } from '@/app/api/health/database/route';

describe('database health response', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns a translation key when the database is unavailable', async () => {
    checkDatabaseConnection.mockResolvedValue(false);

    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: 'unavailable', message: 'DATABASE_UNAVAILABLE', error_code: 'DATABASE_UNAVAILABLE',
    });
  });

  it('keeps the successful health response minimal', async () => {
    checkDatabaseConnection.mockResolvedValue(true);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: 'ok' });
  });
});
