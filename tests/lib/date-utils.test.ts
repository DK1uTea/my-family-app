import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { formatDate, nowUtc, toApiDate } from '@/lib/date-utils';

/** Pin timestamp display to the viewer's timezone, independently of the host machine. */
describe('formatDate', () => {
  const DB_DATE = '2026-07-29T14:00:00Z';

  beforeAll(() => vi.stubEnv('TZ', 'Asia/Ho_Chi_Minh'));
  afterAll(() => vi.unstubAllEnvs());

  it('renders a DB date in the user-selected format without shifting the day', () => {
    expect(formatDate(DB_DATE, 'DD/MM/YYYY')).toBe('29/07/2026');
    expect(formatDate(DB_DATE, 'MM-DD-YYYY')).toBe('07-29-2026');
  });

  it('converts a UTC timestamp to the viewer timezone when includeTime is set', () => {
    expect(formatDate(DB_DATE, 'DD/MM/YYYY', true)).toBe('29/07/2026 21:00');
  });

  it('returns an empty string for a missing date instead of throwing', () => {
    expect(formatDate(null, 'DD/MM/YYYY')).toBe('');
    expect(formatDate(undefined, 'DD/MM/YYYY')).toBe('');
    expect(formatDate('', 'DD/MM/YYYY')).toBe('');
  });

  it('falls back to the default format when none is supplied', () => {
    expect(formatDate(DB_DATE, '' as never)).toBe('29/07/2026');
  });
});

describe('toApiDate', () => {
  it('serializes a picked date without applying a browser offset', () => {
    const picked = new Date(Date.UTC(2026, 6, 29, 14, 0, 0));

    expect(toApiDate(picked)).toBe('2026-07-29T14:00:00.000Z');
  });
});

describe('nowUtc', () => {
  it('returns the current moment as a Date', () => {
    const before = Date.now();
    const now = nowUtc();

    expect(now).toBeInstanceOf(Date);
    expect(now.getTime()).toBeGreaterThanOrEqual(before);
    expect(now.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
