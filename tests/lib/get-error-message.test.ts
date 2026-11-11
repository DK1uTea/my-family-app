import { describe, expect, it } from 'vitest';
import en from '@/messages/en.json';
import vi from '@/messages/vi.json';
import { getErrorMessage } from '@/lib/get-error-message';

const firstPartyErrorKeys = [
  'AUTH_SESSION_INVALID', 'AUTH_INSUFFICIENT_PERMISSION',
  'AUTH_LOGIN_MISSING_CREDENTIALS', 'AUTH_CAPTCHA_FAILED',
  'AUTH_REFRESH_TOKEN_MISSING', 'AUTH_REFRESH_TOKEN_INVALID',
  'USER_NOT_FOUND', 'USER_ROLE_ASSIGNMENT_INVALID',
  'USER_ROLE_ASSIGNMENT_FORBIDDEN', 'USER_ROLE_ASSIGNMENT_NOT_FOUND',
  'ROLE_INVALID', 'ROLE_UNKNOWN_PERMISSION', 'ROLE_ALREADY_EXISTS',
  'ROLE_NOT_FOUND', 'ROLE_RESERVED',
  'TENANT_SEARCH_TOO_LONG', 'TENANT_PAGINATION_INVALID',
  'TENANT_INVALID', 'TENANT_ID_EXISTS', 'TENANT_NOT_FOUND',
  'TENANT_STATUS_INVALID', 'INTERNAL_SERVER_ERROR', 'BACKEND_UNREACHABLE',
  'AUTH_REGISTRATION_CREDENTIALS_MISSING', 'AUTH_LOGIN_INVALID_CREDENTIALS',
  'UPSTREAM_REQUEST_FAILED',
  'DATABASE_UNAVAILABLE',
] as const;

describe('first-party API error translations', () => {
  it('has English and Vietnamese copy for every first-party key', () => {
    for (const key of firstPartyErrorKeys) {
      expect(en.errors).toHaveProperty(key, expect.any(String));
      expect(vi.errors).toHaveProperty(key, expect.any(String));
      expect(en.errors[key]).not.toBe(en.errors.default);
      expect(vi.errors[key]).not.toBe(vi.errors.default);
    }
  });

  it('translates a known key using the current locale and falls back for unknown keys', () => {
    window.history.replaceState({}, '', '/vi/dashboards');
    expect(getErrorMessage('TENANT_NOT_FOUND')).toBe(vi.errors.TENANT_NOT_FOUND);
    expect(getErrorMessage('MISSING_CODE')).toBe(vi.errors.default);

    window.history.replaceState({}, '', '/en/dashboards');
    expect(getErrorMessage('TENANT_NOT_FOUND')).toBe(en.errors.TENANT_NOT_FOUND);
    expect(getErrorMessage('AUTH.LOGIN.ACCOUNT_LOCKED')).toBe(en.errors.AUTH_LOGIN_ACCOUNT_LOCKED);
  });
});
