import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call total database reset
    await localDb.resetAllData();

    return NextResponse.json({ success: true, message: 'All database tables have been reset successfully.' });
  } catch (error) {
    console.error('[Admin Reset DB] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
