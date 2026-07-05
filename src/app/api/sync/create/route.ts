import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

function generateSyncRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'SYNC-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { preset } = body;

    const hostSessionToken = crypto.randomUUID();
    let roomId = generateSyncRoomId();

    let attempts = 0;
    while ((await localDb.getRoom(roomId)) && attempts < 100) {
      roomId = generateSyncRoomId();
      attempts++;
    }

    const room = await localDb.createRoom(roomId, 'sync-local@glowwave.app', 'free', hostSessionToken);
    
    if (preset) {
      await localDb.setCurrentState(roomId, preset);
    }

    return NextResponse.json({
      room_id: room.id,
      host_token: room.host_session_token
    });
  } catch (error) {
    console.error('Sync create error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
