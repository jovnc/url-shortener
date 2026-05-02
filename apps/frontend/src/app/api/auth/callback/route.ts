import { NextRequest, NextResponse } from 'next/server';
import { backendUrl, copySetCookies, toNextResponse } from '@/lib/backend';

export async function GET(request: NextRequest) {
  const headers = new Headers();
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('Cookie', cookie);

  const response = await fetch(
    backendUrl(`/api/v1/auth/callback${request.nextUrl.search}`),
    {
      cache: 'no-store',
      headers,
      redirect: 'manual',
    },
  );

  const location = response.headers.get('location');
  if (!location || response.status < 300 || response.status >= 400) {
    return toNextResponse(response);
  }

  const nextResponse = NextResponse.redirect(location, response.status);
  copySetCookies(response, nextResponse);
  return nextResponse;
}
