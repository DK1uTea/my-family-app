import { describe, expect, it } from 'vitest';
import { stripHtmlToPlainText } from '@/lib/html-utils';

describe('stripHtmlToPlainText', () => {
  it('strips tags and collapses whitespace into a single-line string', () => {
    expect(stripHtmlToPlainText('<p>Hello <strong>world</strong></p>')).toBe('Hello world');
  });

  it('unescapes HTML entities before stripping tags', () => {
    expect(stripHtmlToPlainText('&lt;p&gt;Escaped&lt;/p&gt;')).toBe('Escaped');
  });

  it('collapses multiple block-level tags into single spaces, not concatenated words', () => {
    expect(stripHtmlToPlainText('<p>First</p><p>Second</p>')).toBe('First Second');
  });

  it('returns an empty string for empty or non-string input', () => {
    expect(stripHtmlToPlainText('')).toBe('');
    expect(stripHtmlToPlainText(undefined as unknown as string)).toBe('');
  });

  it('leaves plain text without any tags unchanged', () => {
    expect(stripHtmlToPlainText('Just plain text')).toBe('Just plain text');
  });
});
