import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_ROLE_SEED_ACCOUNTS,
  getRoleSeedAccountsMissingUsers,
  getSeedRolePassword,
} from '@/server/modules/auth/seed-users';

describe('built-in role seed accounts', () => {
  it('uses the documented adult and child fixture emails', () => {
    expect(BUILT_IN_ROLE_SEED_ACCOUNTS.map(({ roleKey, email }) => [roleKey, email])).toEqual([
      ['adult', 'adult.seed@local.test'],
      ['child', 'child.seed@local.test'],
    ]);
  });

  it('builds each fixture password from its email prefix plus @1234', () => {
    expect(getSeedRolePassword('adult.seed@local.test')).toBe('adult.seed@1234');
    expect(getSeedRolePassword('child.seed@local.test')).toBe('child.seed@1234');
  });

  it('returns only built-in roles that do not already have a user', () => {
    expect(getRoleSeedAccountsMissingUsers(['admin', 'adult'])).toEqual([
      expect.objectContaining({ roleKey: 'child', email: 'child.seed@local.test' }),
    ]);
  });

  it('returns no seed accounts when all built-in roles already have users', () => {
    expect(getRoleSeedAccountsMissingUsers(['admin', 'adult', 'child'])).toEqual([]);
  });
});
