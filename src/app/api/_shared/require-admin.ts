import { type NextRequest, NextResponse } from 'next/server';
import { requireAuthenticated } from '@/app/api/_shared/require-authenticated';
import { rolesService } from '@/server/modules/roles';
import { apiError } from '@/app/api/_shared/error-response';

export async function requireAdmin(req: NextRequest): Promise<string | NextResponse> {
  const actorId = await requireAuthenticated(req);
  if (actorId instanceof NextResponse) return actorId;
  if (!await rolesService.isAdmin(actorId.userId)
    && !await rolesService.isSuperAdmin(actorId.userId)) {
    return apiError(403, 'AUTH_INSUFFICIENT_PERMISSION');
  }
  return actorId.userId;
}
