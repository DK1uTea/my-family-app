import "server-only";

import bcrypt from "bcryptjs";
import { nowUtc } from "@/lib/date-utils";
import {
  authRepository,
  type AuthRepository,
} from "@/server/layer-data/auth";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./auth.jwt";
import type { LoginInput, LoginResult, RefreshResult } from "./auth.types";

const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  constructor(private readonly repo: AuthRepository = authRepository) {}

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.repo.findCredentialByEmail(input.email);

    if (!user) {
      return { success: false, status: 401, errorCode: "WRONG_PASSWORD" };
    }

    const now = nowUtc();

    if (user.isLocked && user.lockedUntil) {
      if (now < user.lockedUntil) {
        const remainingSeconds = Math.max(
          1,
          Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 1000),
        );
        return {
          success: false,
          status: 401,
          errorCode: "AUTH.LOGIN.ACCOUNT_LOCKED",
          loginBlockDuration: remainingSeconds,
        };
      }
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      const lockResult = await this.repo.recordFailedAttempt(
        user.userId,
        user.failedAttempts,
        user.maxAttempts,
      );

      if (lockResult.isLocked) {
        return {
          success: false,
          status: 401,
          errorCode: "AUTH.LOGIN.ACCOUNT_LOCKED",
          loginBlockDuration: lockResult.lockDurationSeconds,
        };
      }

      return {
        success: false,
        status: 401,
        errorCode: "WRONG_PASSWORD",
        attemptsRemaining: lockResult.attemptsRemaining,
      };
    }

    await this.repo.resetFailedAttempts(user.userId);

    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS);
    const accessToken = await signAccessToken({
      sub: user.userId,
      email: user.email,
    });

    const refreshToken = await signRefreshToken({
      sub: user.userId,
      tokenId: user.userId,
    });

    await this.repo.createRefreshToken({
      userId: user.userId,
      tokenHash: hashToken(refreshToken),
      expiresAt,
      userAgent: input.userAgent,
      ipAddress: input.clientIp,
    });

    const status = user.mustChangePassword ? 203 : 200;
    const message = user.mustChangePassword
      ? "Password change required"
      : "OK";

    return {
      success: true,
      status,
      message,
      data: { accessToken, refreshToken },
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload?.sub) {
      return { success: false, status: 401, message: "Invalid refresh token" };
    }

    const currentHash = hashToken(refreshToken);
    const existing = await this.repo.findRefreshToken(currentHash);

    if (
      !existing ||
      existing.revokedAt ||
      existing.expiresAt.getTime() <= nowUtc().getTime()
    ) {
      return {
        success: false,
        status: 401,
        message: "Refresh token expired or revoked",
      };
    }

    await this.repo.revokeRefreshToken(currentHash);

    const now = nowUtc();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS);

    const newAccessToken = await signAccessToken({
      sub: payload.sub,
      email: "",
    });

    const newRefreshToken = await signRefreshToken({
      sub: payload.sub,
      tokenId: payload.sub,
    });

    await this.repo.createRefreshToken({
      userId: payload.sub,
      tokenHash: hashToken(newRefreshToken),
      expiresAt,
    });

    return {
      success: true,
      status: 200,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  async logout(refreshToken?: string): Promise<{ status: number }> {
    if (refreshToken) {
      await this.repo.revokeRefreshToken(hashToken(refreshToken)).catch(() => {});
    }
    return { status: 200 };
  }
}

export const authService = new AuthService();
