import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const SHORT_CODE_PATTERN = /^[0-9a-zA-Z]+$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!SHORT_CODE_PATTERN.test(code)) {
    return new NextResponse('Short link not found', { status: 404 });
  }

  const response = await fetch(`${API}/api/v1/links/${code}`, {
    cache: 'no-store',
    redirect: 'manual',
  });

  if (response.status === 302) {
    const location = response.headers.get('location');
    if (location) return NextResponse.redirect(location, 302);
  }

  if (response.status === 410) {
    return new NextResponse('Short link expired or disabled', { status: 410 });
  }

  return new NextResponse('Short link not found', { status: 404 });
}
