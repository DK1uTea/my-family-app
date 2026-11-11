import bcrypt from 'bcryptjs';
import { describe, expect, it, vi } from 'vitest';
import type { AuthRepository } from '@/server/layer-data/auth';
import type { AuthCredentialRecord } from '@/server/layer-data/auth';
import { AuthService } from '@/server/modules/auth/auth.service';

const { signAccessToken, verifyAccessToken } = vi.hoisted(() => ({
  signAccessToken: vi.fn(),
  verifyAccessToken: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/server/layer-data/auth', () => ({ authRepository: {} }));
vi.mock('@/server/modules/auth/auth.jwt', () => ({
  hashToken: vi.fn((token: string) => token),
  signAccessToken,
  signRefreshToken: vi.fn(async () => 'refresh-token'),
  verifyAccessToken,
  verifyRefreshToken: vi.fn(),
}));

type CredentialWithScope = AuthCredentialRecord & {
  roleKey: string;
  tenantId: string | null;
  tenantIsActive: boolean;
};

async function makeAuth(user: CredentialWithScope) {
  vi.clearAllMocks();
  signAccessToken.mockResolvedValue('signed-access-token');
  verifyAccessToken.mockResolvedValue(null);
  const identity = {
    userId: user.userId,
    email: user.email,
    roleKey: user.roleKey,
    tenantId: user.tenantId,
    tenantIsActive: user.tenantIsActive,
  };
  const repo = {
    findCredentialByEmail: vi.fn(async () => user),
    findIdentityById: vi.fn(async (userId: string) => userId === user.userId ? identity : null),
    resetFailedAttempts: vi.fn(async () => undefined),
    createRefreshToken: vi.fn(async () => 'refresh-row-id'),
  } as unknown as AuthRepository;
  const service = new AuthService(repo);
  const passwordHash = await bcrypt.hash('correct-password', 4);
  user.passwordHash = passwordHash;
  return { service, repo };
}

function credential(overrides: Partial<CredentialWithScope> = {}): CredentialWithScope {
  return {
    userId: 'user-1',
    email: 'user@example.test',
    passwordHash: '',
    isLocked: false,
    lockedUntil: null,
    failedAttempts: 0,
    maxAttempts: 5,
    mustChangePassword: false,
    roleKey: 'adult',
    tenantId: 'tenant-a',
    tenantIsActive: true,
    ...overrides,
  };
}

describe('AuthService tenant scope', () => {
  it('issues access tokens with role and tenant scope from the stored user', async () => {
    const { service } = await makeAuth(credential());

    const result = await service.login({ email: 'user@example.test', password: 'correct-password' });

    expect(result.success).toBe(true);
    expect(signAccessToken).toHaveBeenCalledWith({
      sub: 'user-1', email: 'user@example.test', roleKey: 'adult', tenantId: 'tenant-a',
    });
  });

  it('allows a tenantless session only for the stored super-admin role', async () => {
    const { service } = await makeAuth(credential({ roleKey: 'super_admin', tenantId: null }));

    const result = await service.login({ email: 'user@example.test', password: 'correct-password' });

    expect(result.success).toBe(true);
    expect(signAccessToken).toHaveBeenCalledWith({
      sub: 'user-1', email: 'user@example.test', roleKey: 'super_admin', tenantId: null,
    });
  });

  it('rejects a tenant account without a tenant assignment', async () => {
    const { service } = await makeAuth(credential({ tenantId: null }));

    const result = await service.login({ email: 'user@example.test', password: 'correct-password' });

    expect(result.success).toBe(false);
    expect(result.data?.accessToken).toBeUndefined();
  });

  it('rejects login when the assigned tenant is inactive', async () => {
    const { service } = await makeAuth(credential({ tenantIsActive: false }));

    const result = await service.login({ email: 'user@example.test', password: 'correct-password' });

    expect(result.success).toBe(false);
    expect(result.data?.accessToken).toBeUndefined();
  });

  it('returns an actor only when the verified token matches current tenant membership', async () => {
    const { service } = await makeAuth(credential());
    verifyAccessToken.mockResolvedValue({
      sub: 'user-1', email: 'user@example.test', roleKey: 'adult', tenantId: 'tenant-a',
    });

    await expect(service.authenticateAccessToken('signed-token')).resolves.toEqual({
      userId: 'user-1', email: 'user@example.test', roleKey: 'adult', tenantId: 'tenant-a',
    });
  });

  it('rejects an access token when the stored role or tenant has changed', async () => {
    const { service } = await makeAuth(credential());
    verifyAccessToken.mockResolvedValue({
      sub: 'user-1', email: 'user@example.test', roleKey: 'admin', tenantId: 'tenant-b',
    });

    await expect(service.authenticateAccessToken('stale-token')).resolves.toBeNull();
  });

  it('rejects access tokens that omit their signed tenant claim', async () => {
    const { service } = await makeAuth(credential());
    verifyAccessToken.mockResolvedValue({
      sub: 'user-1', email: 'user@example.test', roleKey: 'adult',
    });

    await expect(service.authenticateAccessToken('legacy-token')).resolves.toBeNull();
  });
});
