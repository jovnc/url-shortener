import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backend';

export function GET(request: NextRequest) {
  return proxyBackend(request, '/api/v1/auth/me');
}
