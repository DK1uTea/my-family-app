import "server-only";

/** Persistence-neutral credential record used by authentication use cases. */
export type AuthCredentialRecord = {
  userId: string;
  email: string;
  passwordHash: string;
  isLocked: boolean;
  lockedUntil: Date | null;
  failedAttempts: number;
  maxAttempts: number;
  mustChangePassword: boolean;
};

export type CreateRefreshTokenData = {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};
