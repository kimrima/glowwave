import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, host_session_token, passcode } = body as {
      room_id: string;
      host_session_token: string;
      passcode: string | null;
    };

    if (!room_id || !host_session_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const room = await localDb.getRoom(room_id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify host token match
    if (room.host_session_token !== host_session_token) {
      return NextResponse.json({ error: 'Unauthorized host token' }, { status: 401 });
    }

    // Free rooms are not allowed to have passcodes
    if (room.tier === 'free' && passcode) {
      return NextResponse.json({ error: '무료 요금제에서는 비밀번호 기능을 사용할 수 없습니다.' }, { status: 403 });
    }

    // Perform passcode update (empty string or null translates to undefined/null in DB)
    const normalizedPasscode = passcode && passcode.trim().length > 0 ? passcode.trim() : undefined;
    const success = await localDb.updateRoomPasscode(room_id, normalizedPasscode);
    if (!success) {
      return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      passcode: normalizedPasscode || null,
    });
  } catch (error) {
    console.error('Update passcode error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
