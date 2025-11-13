import { NextRequest, NextResponse } from 'next/server';
import { findUserById, updateUser } from '@/lib/db';
import { generateQRToken, requireAuth } from '@/lib/auth';

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
  const user = await findUserById(targetId);
  
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (authResult.user.id !== user.id && !authResult.user.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if user has a valid QR token
  let qrToken = user.qrToken;
  const now = new Date();
  
  // Generate new token if:
  // 1. No token exists
  // 2. Token has expired
  // 3. Force refresh is requested (optional query param)
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
  
  if (!qrToken || !user.qrTokenExpiry || new Date(user.qrTokenExpiry) < now || forceRefresh) {
    // Generate new short token valid for 1 year (only contains user ID)
    qrToken = generateQRToken(user.id, '365d');
    
    // Set expiry to 1 year from now
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    
    // Update user with new token and expiry
    await updateUser(targetId, {
      qrToken,
      qrTokenExpiry: expiry.toISOString(),
    });
  }

  return NextResponse.json({ qrcodeToken: qrToken });
}
