import { describe, expect, it } from 'vitest';
import {
  getSeedRoleAccountsMissingUsers,
  getTenantSeedAccounts,
} from '@/server/modules/auth/seed-users';

const completeTenantSeedEnv = {
  SEED_TENANT_ADMIN_EMAIL: 'admin.seed@example.test',
  SEED_TENANT_ADMIN_PASSWORD: 'admin-password-123',
  SEED_TENANT_ADULT_EMAIL: 'adult.seed@example.test',
  SEED_TENANT_ADULT_PASSWORD: 'adult-password-123',
  SEED_TENANT_CHILD_EMAIL: 'child.seed@example.test',
  SEED_TENANT_CHILD_PASSWORD: 'child-password-123',
};

describe('tenant role seed configuration', () => {
  it('returns one configured account for each tenant role in stable order', () => {
    const accounts = getTenantSeedAccounts(completeTenantSeedEnv);

    expect(accounts).toEqual([
      expect.objectContaining({ roleKey: 'admin', email: 'admin.seed@example.test', password: 'admin-password-123' }),
      expect.objectContaining({ roleKey: 'adult', email: 'adult.seed@example.test', password: 'adult-password-123' }),
      expect.objectContaining({ roleKey: 'child', email: 'child.seed@example.test', password: 'child-password-123' }),
    ]);
  });

  it('trims and lowercases configured emails without altering passwords', () => {
    const accounts = getTenantSeedAccounts({
      ...completeTenantSeedEnv,
      SEED_TENANT_ADMIN_EMAIL: '  Admin.Seed@Example.Test  ',
      SEED_TENANT_ADMIN_PASSWORD: '  admin-password-123  ',
    });

    expect(accounts[0]).toMatchObject({
      email: 'admin.seed@example.test',
      password: '  admin-password-123  ',
    });
  });

  it('rejects missing or blank required account configuration', () => {
    expect(() => getTenantSeedAccounts({})).toThrow();
    expect(() => getTenantSeedAccounts({
      ...completeTenantSeedEnv,
      SEED_TENANT_ADULT_EMAIL: '   ',
    })).toThrow();
  });

  it('requires each configured password to contain at least twelve characters', () => {
    expect(() => getTenantSeedAccounts({
      ...completeTenantSeedEnv,
      SEED_TENANT_CHILD_PASSWORD: 'short-pass',
    })).toThrow();
  });

  it('rejects invalid email values', () => {
    expect(() => getTenantSeedAccounts({
      ...completeTenantSeedEnv,
      SEED_TENANT_ADMIN_EMAIL: 'not-an-email',
    })).toThrow();
  });

  it('rejects email collisions after case and whitespace normalization', () => {
    expect(() => getTenantSeedAccounts({
      ...completeTenantSeedEnv,
      SEED_TENANT_CHILD_EMAIL: ' ADMIN.SEED@EXAMPLE.TEST ',
    })).toThrow();
  });

  it('selects only configured tenant roles that do not already have an account', () => {
    const accounts = getTenantSeedAccounts(completeTenantSeedEnv);

    expect(getSeedRoleAccountsMissingUsers(accounts, ['admin', 'adult'])).toEqual([
      expect.objectContaining({ roleKey: 'child', email: 'child.seed@example.test' }),
    ]);
  });

  it('returns no configured tenant accounts when all roles are represented', () => {
    const accounts = getTenantSeedAccounts(completeTenantSeedEnv);

    expect(getSeedRoleAccountsMissingUsers(accounts, ['admin', 'adult', 'child'])).toEqual([]);
  });
});
