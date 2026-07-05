import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    const isAuthenticated = verifyAdminToken(token);

    return NextResponse.json({ authenticated: isAuthenticated });
  } catch (error) {
    console.error('[Admin Check] Error:', error);
    return NextResponse.json({ authenticated: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
