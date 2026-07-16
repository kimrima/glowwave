import { NextRequest, NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('[CS Submit Route] Received POST request.');
    const body = await request.json();
    console.log('[CS Submit Route] Body payload:', body);

    const { email, category, message, room_id } = body as {
      email: string;
      category: 'refund' | 'recovery' | 'bug' | 'etc';
      message: string;
      room_id?: string;
    };

    if (!email || !category || !message) {
      console.warn('[CS Submit Route] Missing validation check fields:', { email, category, message });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('[CS Submit Route] Triggering addCSInquiry...');
    await localDb.addCSInquiry({
      email,
      category,
      message,
      room_id
    });

    console.log('[CS Submit Route] Success response complete!');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[CS Submit API] Fatal crash captured:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error?.message }, { status: 500 });
  }
}
