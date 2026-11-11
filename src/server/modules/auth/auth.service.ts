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
  verifyAccessToken,
  verifyRefreshToken,
} from "./auth.jwt";
import { UserRole } from "@/server/modules/roles/permissions";
import type {
  AuthenticatedActor,
  LoginInput,
  LoginResult,
  RefreshResult,
} from "./auth.types";

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

    if (!this.hasValidTenantScope(user)) {
      return { success: false, status: 403, errorCode: "AUTH.TENANT_ACCESS_DENIED" };
    }

    await this.repo.resetFailedAttempts(user.userId);

    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS);
    const accessToken = await signAccessToken({
      sub: user.userId,
      email: user.email,
      roleKey: user.roleKey!,
      tenantId: user.tenantId,
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
      ? "AUTH_PASSWORD_CHANGE_REQUIRED"
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
      return { success: false, status: 401, message: "AUTH_REFRESH_TOKEN_INVALID" };
    }

    const currentHash = hashToken(refreshToken);
    const existing = await this.repo.findRefreshToken(currentHash);

    if (
      !existing ||
      existing.userId !== payload.sub ||
      existing.revokedAt ||
      existing.expiresAt.getTime() <= nowUtc().getTime()
    ) {
      return {
        success: false,
        status: 401,
        message: "AUTH_REFRESH_TOKEN_INVALID",
      };
    }

    const identity = await this.repo.findIdentityById(payload.sub);
    if (!identity || !this.hasValidTenantScope(identity)) {
      return { success: false, status: 401, message: "AUTH_TENANT_ACCESS_DENIED" };
    }

    await this.repo.revokeRefreshToken(currentHash);

    const now = nowUtc();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS);

    const newAccessToken = await signAccessToken({
      sub: payload.sub,
      email: identity.email,
      roleKey: identity.roleKey!,
      tenantId: identity.tenantId,
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

  async authenticateAccessToken(token: string): Promise<AuthenticatedActor | null> {
    const payload = await verifyAccessToken(token);
    if (!payload?.sub || !payload.roleKey || payload.tenantId === undefined) return null;

    const identity = await this.repo.findIdentityById(payload.sub);
    if (!identity || !this.hasValidTenantScope(identity)) return null;
    if (
      identity.roleKey !== payload.roleKey ||
      identity.tenantId !== payload.tenantId ||
      identity.email !== payload.email
    ) {
      return null;
    }

    return {
      userId: identity.userId,
      email: identity.email,
      roleKey: identity.roleKey,
      tenantId: identity.tenantId,
    };
  }

  private hasValidTenantScope(
    user: { roleKey: string | null; tenantId: string | null; tenantIsActive: boolean | null },
  ): user is { roleKey: string; tenantId: string | null; tenantIsActive: boolean | null } {
    if (!user.roleKey) return false;
    if (user.roleKey === UserRole.SUPER_ADMIN) return user.tenantId === null;
    return user.tenantId !== null && user.tenantIsActive === true;
  }

  async logout(refreshToken?: string): Promise<{ status: number }> {
    if (refreshToken) {
      await this.repo.revokeRefreshToken(hashToken(refreshToken)).catch(() => {});
    }
    return { status: 200 };
  }
}

export const authService = new AuthService();
