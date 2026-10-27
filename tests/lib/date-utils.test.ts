import { describe, expect, it } from 'vitest';

import { formatDate, nowUtc, toApiDate } from '@/lib/date-utils';

/**
 * These tests pin the project's "Germany stored as UTC+0" convention:
 * a timestamp of 14:00Z means 14:00 Germany time and must render as 14:00
 * regardless of the machine's timezone. If one of these ever fails on a
 * teammate's machine, the offset leaked back in.
 */
describe('formatDate', () => {
  const DB_DATE = '2026-07-29T14:00:00Z';

  it('renders a DB date in the user-selected format without shifting the day', () => {
    expect(formatDate(DB_DATE, 'DD/MM/YYYY')).toBe('29/07/2026');
    expect(formatDate(DB_DATE, 'MM-DD-YYYY')).toBe('07-29-2026');
  });

  it('appends the wall-clock time unchanged when includeTime is set', () => {
    expect(formatDate(DB_DATE, 'DD/MM/YYYY', true)).toBe('29/07/2026 14:00');
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
