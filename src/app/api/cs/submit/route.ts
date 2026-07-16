import { NextRequest, NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, category, message, room_id } = body as {
      email: string;
      category: 'refund' | 'recovery' | 'bug' | 'etc';
      message: string;
      room_id?: string;
    };

    if (!email || !category || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await localDb.addCSInquiry({
      email,
      category,
      message,
      room_id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CS Submit API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
