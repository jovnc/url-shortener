import { NextRequest } from 'next/server';
import { proxyBackend } from '@/lib/backend';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyBackend(request, `/api/v1/links/${id}`);
}
