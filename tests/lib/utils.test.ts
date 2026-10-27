import { describe, expect, it } from 'vitest';

import { getUserInitials, stripHtmlTags } from '@/lib/utils';

describe('getUserInitials', () => {
  it('returns the first letter of the first two words, uppercased', () => {
    expect(getUserInitials('lucas nam')).toBe('LN');
  });

  it('ignores words beyond the second', () => {
    expect(getUserInitials('Anna Maria Schmidt')).toBe('AM');
  });

  it('collapses repeated whitespace between words', () => {
    expect(getUserInitials('  Anna   Schmidt  ')).toBe('AS');
  });

  it('falls back to "U" when the value is missing', () => {
    expect(getUserInitials(undefined)).toBe('U');
  });

  it('falls back to "U" when the value is only whitespace', () => {
    expect(getUserInitials('   ')).toBe('U');
  });
});

describe('stripHtmlTags', () => {
  it('removes angle brackets so the value cannot open a tag', () => {
    expect(stripHtmlTags('<script>alert(1)</script>')).toBe('scriptalert(1)/script');
  });

  it('trims surrounding whitespace', () => {
    expect(stripHtmlTags('  hello  ')).toBe('hello');
  });

  it('leaves plain text untouched', () => {
    expect(stripHtmlTags('Anna Schmidt')).toBe('Anna Schmidt');
  });
});
