import { NextResponse } from 'next/server';
import { generateAdminToken } from '@/lib/adminAuth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body as { password?: string };

    const expectedPassword = process.env.ADMIN_PASSWORD || 'glowwave123';

    if (!password || password !== expectedPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const token = generateAdminToken();

    const response = NextResponse.json({ success: true });
    
    // Set admin session cookie (HTTP-only, Secure, sameSite=strict)
    response.cookies.set('glowwave_admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
