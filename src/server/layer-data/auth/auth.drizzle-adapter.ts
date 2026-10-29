import "server-only";

import { and, eq } from "drizzle-orm";
import { nowUtc } from "@/lib/date-utils";
import { refreshTokens, users } from "@/server/drizzle/schema";
import { db } from "@/server/third-party/drizzle/client";
import type { AuthRepository } from "./auth.repository";
import type {
  AuthCredentialRecord,
  CreateRefreshTokenData,
  RefreshTokenRecord,
} from "./auth.types";

export class DrizzleAuthRepository implements AuthRepository {
  async findCredentialByEmail(
    email: string,
  ): Promise<AuthCredentialRecord | null> {
    const records = await db
      .select({
        userId: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        isLocked: users.isLocked,
        lockedUntil: users.lockedUntil,
        failedAttempts: users.failedAttempts,
        maxAttempts: users.maxAttempts,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    return records[0] ?? null;
  }

  async recordFailedAttempt(
    userId: string,
    currentAttempts: number,
    maxAttempts: number,
    lockMinutes = 15,
  ): Promise<{
    isLocked: boolean;
    attemptsRemaining: number;
    lockDurationSeconds?: number;
  }> {
    const nextAttempts = currentAttempts + 1;
    const now = nowUtc();

    if (nextAttempts >= maxAttempts) {
      const lockedUntil = new Date(now.getTime() + lockMinutes * 60 * 1000);
      await db
        .update(users)
        .set({
          isLocked: true,
          lockedUntil,
          failedAttempts: nextAttempts,
          updatedAt: now,
        })
        .where(eq(users.id, userId));

      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockDurationSeconds: lockMinutes * 60,
      };
    }

    await db
      .update(users)
      .set({
        failedAttempts: nextAttempts,
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    return {
      isLocked: false,
      attemptsRemaining: Math.max(0, maxAttempts - nextAttempts),
    };
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    const now = nowUtc();
    await db
      .update(users)
      .set({
        failedAttempts: 0,
        isLocked: false,
        lockedUntil: null,
        lastLoginAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }

  async createRefreshToken(data: CreateRefreshTokenData): Promise<string> {
    const records = await db
      .insert(refreshTokens)
      .values({
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
        createdAt: nowUtc(),
      })
      .returning({ id: refreshTokens.id });

    return records[0].id;
  }

  async findRefreshToken(
    tokenHash: string,
  ): Promise<RefreshTokenRecord | null> {
    const records = await db
      .select({
        id: refreshTokens.id,
        userId: refreshTokens.userId,
        tokenHash: refreshTokens.tokenHash,
        expiresAt: refreshTokens.expiresAt,
        revokedAt: refreshTokens.revokedAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1);

    return records[0] ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: nowUtc() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: nowUtc() })
      .where(
        and(eq(refreshTokens.userId, userId)),
      );
  }
}

export const authRepository = new DrizzleAuthRepository();

