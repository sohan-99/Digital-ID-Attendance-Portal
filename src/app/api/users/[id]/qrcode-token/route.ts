import { NextRequest, NextResponse } from 'next/server';
import { findUserById } from '@/lib/db';
import { generateUserToken, requireAuth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = requireAuth(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const resolvedParams = await params;
  const targetId = parseInt(resolvedParams.id, 10);
  const user = findUserById(targetId);
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (authResult.user.id !== user.id && !authResult.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const token = generateUserToken(user, '12h');
  return NextResponse.json({ qrcodeToken: token });
}
