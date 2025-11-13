import { NextRequest, NextResponse } from 'next/server';
import { getScannerLoginLogs } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || undefined;
    const successParam = searchParams.get('success');
    const limitParam = searchParams.get('limit');
    
    const success = successParam ? successParam === 'true' : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    const logs = await getScannerLoginLogs({
      username,
      success,
      limit,
    });

    // Calculate statistics
    const stats = {
      total: logs.length,
      successful: logs.filter(log => log.success).length,
      failed: logs.filter(log => !log.success).length,
      successRate: logs.length > 0 
        ? Math.round((logs.filter(log => log.success).length / logs.length) * 100) 
        : 0,
    };

    return NextResponse.json({
      logs,
      stats,
    });
  } catch (error) {
    console.error('Scanner login logs error:', error);
    return NextResponse.json({ error: 'Failed to fetch login logs' }, { status: 500 });
  }
}
