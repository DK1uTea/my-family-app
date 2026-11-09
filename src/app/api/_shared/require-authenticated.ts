import { type NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/server/modules/auth';

export async function requireAuthenticated(
  req: NextRequest,
): Promise<string | NextResponse> {
  const cookieToken = req.cookies.get('accessToken')?.value;
  const header = req.headers.get('authorization');
  const headerToken = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  const payload = await verifyAccessToken(cookieToken ?? headerToken ?? '');
  if (!payload?.sub) {
    return NextResponse.json({ status: 401, message: 'Unauthorized' }, { status: 401 });
  }
  return payload.sub;
}
