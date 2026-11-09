import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function handleClearCookies() {
  const cookieStore = await cookies();

  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');

  return NextResponse.json({ message: 'Cookies cleared' });
}
