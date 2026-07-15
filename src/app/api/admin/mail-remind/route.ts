import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId } = body as { roomId: string };

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // 1. Fetch Room Info to ensure it exists
    const room = await localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // 2. Perform Mock Email Sending Log
    const nowStr = new Date().toISOString();
    console.log(`[CS REMINDER MAIL] Sent renewal warning email successfully to ${room.email} for Room [${roomId}]. Sent at: ${nowStr}`);

    // 3. Update the room's mail_sent_at field
    const success = await localDb.updateRoom(roomId, {
      mail_sent_at: nowStr
    });

    if (!success) {
      return NextResponse.json({ error: 'Failed to record mailing timestamp' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mail_sent_at: nowStr,
      message: `CS 경고 메일이 ${room.email} 앞으로 전송 완료되었습니다.`
    });
  } catch (error: any) {
    console.error('[Admin Mail Remind] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
