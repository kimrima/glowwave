import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { localDb } from '@/lib/localDb';

export async function POST(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const roomId = (resolvedParams.roomId as string).toUpperCase();
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { passcode } = body as { passcode: string };

    const room = await localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: '방을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!room.passcode) {
      return NextResponse.json({ success: true });
    }

    const hashedInput = crypto.createHash('sha256').update(passcode || '').digest('hex');

    if (room.passcode === hashedInput) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: '비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify passcode error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
