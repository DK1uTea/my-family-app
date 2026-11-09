import { type NextRequest, NextResponse } from 'next/server';
import { requireAuthenticated } from '@/app/api/_shared/require-authenticated';
import { rolesService } from '@/server/modules/roles';
import type { UserRole } from '@/server/modules/roles';

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

    if (policy.roles?.length && !await rolesService.hasAnyRole(actorId, policy.roles)) {
      return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });
    }
    if (policy.permissions?.length
      && !await rolesService.canAccessAnyPermission(actorId, policy.permissions)) {
      return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });
    }

    return handler(req, actorId, context);
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
