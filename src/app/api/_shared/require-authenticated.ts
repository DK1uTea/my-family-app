import { type NextRequest, NextResponse } from 'next/server';
import { authService, type AuthenticatedActor } from '@/server/modules/auth';
import { apiError } from '@/app/api/_shared/error-response';

export async function requireAuthenticated(
  req: NextRequest,
): Promise<AuthenticatedActor | NextResponse> {
  const cookieToken = req.cookies.get('accessToken')?.value;
  const header = req.headers.get('authorization');
  const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const actor = await authService.authenticateAccessToken(cookieToken ?? headerToken ?? '');
  if (!actor) {
    return apiError(401, 'AUTH_SESSION_INVALID');
  }
  return actor;
}
