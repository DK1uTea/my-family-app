import "server-only";

import type {
  AuthCredentialRecord,
  CreateRefreshTokenData,
  RefreshTokenRecord,
} from "./auth.types";

/** Persistence contract for looking up password-based identities and session tokens. */
export interface AuthRepository {
  findCredentialByEmail(email: string): Promise<AuthCredentialRecord | null>;
  recordFailedAttempt(
    userId: string,
    currentAttempts: number,
    maxAttempts: number,
    lockMinutes?: number,
  ): Promise<{
    isLocked: boolean;
    attemptsRemaining: number;
    lockDurationSeconds?: number;
  }>;
  resetFailedAttempts(userId: string): Promise<void>;
  createRefreshToken(data: CreateRefreshTokenData): Promise<string>;
  findRefreshToken(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
}
