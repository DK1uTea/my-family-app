import { type NextRequest, NextResponse } from 'next/server';
import { requireAuthenticated } from '@/app/api/_shared/require-authenticated';
import { rolesService } from '@/server/modules/roles';

export async function requireAdmin(req: NextRequest): Promise<string | NextResponse> {
  const actorId = await requireAuthenticated(req);
  if (actorId instanceof NextResponse) return actorId;
  if (!await rolesService.isAdmin(actorId)) {
    return NextResponse.json({ status: 403, message: 'Forbidden' }, { status: 403 });
  }
  return actorId;
}
