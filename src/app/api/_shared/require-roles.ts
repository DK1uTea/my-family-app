import { type NextRequest, NextResponse } from 'next/server';
import { requireAuthenticated } from '@/app/api/_shared/require-authenticated';
import { rolesService } from '@/server/modules/roles';
import type { UserRole } from '@/server/modules/roles';
import { apiError } from '@/app/api/_shared/error-response';

type AuthenticatedHandler<Context> = (
  req: NextRequest,
  actorId: string,
  context: Context,
) => Promise<Response>;

type AccessPolicy = {
  roles?: readonly UserRole[];
  permissions?: readonly string[];
};

export function withAccessPolicy<Context = unknown>(
  policy: AccessPolicy,
  handler: AuthenticatedHandler<Context>,
) {
  return async (req: NextRequest, context: Context): Promise<Response> => {
    const actorId = await requireAuthenticated(req);
    if (actorId instanceof NextResponse) return actorId;

    if (policy.roles?.length && !await rolesService.hasAnyRole(actorId.userId, policy.roles)) {
      return apiError(403, 'AUTH_INSUFFICIENT_PERMISSION');
    }
    if (policy.permissions?.length
      && !await rolesService.canAccessAnyPermission(actorId.userId, policy.permissions)) {
      return apiError(403, 'AUTH_INSUFFICIENT_PERMISSION');
    }

    return handler(req, actorId.userId, context);
  };
}

export function requireRoles(roles: readonly UserRole[]) {
  return <Context = unknown>(handler: AuthenticatedHandler<Context>) =>
    withAccessPolicy({ roles }, handler);
}

export function requirePermissions(permissionKeys: readonly string[]) {
  return <Context = unknown>(handler: AuthenticatedHandler<Context>) =>
    withAccessPolicy({ permissions: permissionKeys }, handler);
}

export function withAuth<Context = unknown>(handler: AuthenticatedHandler<Context>) {
  return withAccessPolicy({}, handler);
}
