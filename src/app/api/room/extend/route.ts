import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, host_session_token } = body as {
      room_id: string;
      host_session_token: string;
    };

    if (!room_id || !host_session_token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const roomId = room_id.toUpperCase();
    const room = await localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.host_session_token !== host_session_token) {
      return NextResponse.json({ error: 'Unauthorized host session token' }, { status: 401 });
    }

    const success = await localDb.extendRoom(roomId, 24);
    if (!success) {
      return NextResponse.json({ error: 'Failed to extend room' }, { status: 500 });
    }

    const updatedRoom = await localDb.getRoom(roomId);

    return NextResponse.json({
      success: true,
      created_at: updatedRoom?.created_at
    });
  } catch (error) {
    console.error('Room extension error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
